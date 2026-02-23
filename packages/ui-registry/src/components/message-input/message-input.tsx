"use client";

import { useTamboMcpPrompt } from "@tambo-ai/react/mcp";
import { ElicitationUI } from "@tambo-ai/ui-registry/components/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@tambo-ai/ui-registry/components/mcp-components";
import {
  Tooltip,
  TooltipProvider,
} from "@tambo-ai/ui-registry/components/message-suggestions";
import { cn } from "@tambo-ai/ui-registry/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  AtSign,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import * as React from "react";
import { McpConfigModal } from "./mcp-config-modal";
import {
  getImageItems,
  TextEditor,
  type PromptItem,
  type ResourceItem,
  type TamboEditor,
} from "./text-editor";

// Import base compound components and constants
import {
  IS_PASTED_IMAGE,
  MAX_IMAGES,
  MessageInput as MessageInputBase,
  type PromptProvider,
  type ResourceProvider,
  type StagedImageRenderProps,
} from "@tambo-ai/react-ui-base/message-input";

// Lazy load DictationButton for code splitting (framework-agnostic alternative to next/dynamic)
// eslint-disable-next-line @typescript-eslint/promise-function-async
const LazyDictationButton = React.lazy(() => import("./dictation-button"));

/**
 * Wrapper component that includes Suspense boundary for the lazy-loaded DictationButton.
 * This ensures the component can be safely used without requiring consumers to add their own Suspense.
 * Also handles SSR by only rendering on the client (DictationButton uses Web Audio APIs).
 */
const DictationButton = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <LazyDictationButton />
    </React.Suspense>
  );
};

const noop = () => {};

// Re-export provider interfaces from base
export type { PromptProvider, ResourceProvider };

/** CSS variants for the message input container */
const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-gray-300 [&>div]:dark:border-zinc-600",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the TamboEditor instance. */
  inputRef?: React.RefObject<TamboEditor | null>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * Composes the headless MessageInput.Root from base for all business logic.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, inputRef, ...props }, ref) => {
    return (
      <MessageInputBase.Root
        ref={ref}
        inputRef={inputRef}
        className={cn(messageInputVariants({ variant }), className)}
        {...props}
      >
        <TooltipProvider>
          {/* Use data-* classes for styling, render props only for behavior changes */}
          <MessageInputBase.Content
            className={cn(
              "group relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3 border",
              // Styling via data attributes - no render prop needed for drag state
              "border-border data-dragging:border-dashed data-dragging:border-emerald-400",
            )}
            render={(_props, { elicitation, resolveElicitation }) => (
              <>
                {/* Drop overlay styled with CSS, shown via group-data-[dragging] */}
                <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 items-center justify-center pointer-events-none z-20 hidden group-data-dragging:flex">
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Drop files here to add to conversation
                  </p>
                </div>

                {elicitation && resolveElicitation ? (
                  <ElicitationUI
                    request={elicitation}
                    onResponse={resolveElicitation}
                  />
                ) : (
                  <>
                    <MessageInputStagedImages />
                    {children}
                  </>
                )}
              </>
            )}
          />
        </TooltipProvider>
      </MessageInputBase.Root>
    );
  },
);
MessageInput.displayName = "MessageInput";

// IS_PASTED_IMAGE and MAX_IMAGES imported from base

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom placeholder text. */
  placeholder?: string;
  /** Resource provider for @ mentions (optional - includes interactables by default) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional) */
  promptProvider?: PromptProvider;
  /** Callback when a resource is selected from @ mentions (optional) */
  onResourceSelect?: (item: ResourceItem) => void;
}

/**
 * Rich-text textarea component for entering message text with @ mention support.
 * Uses the TipTap-based TextEditor which supports:
 * - @ mention autocomplete for interactables plus optional static items and async fetchers
 * - Keyboard navigation (Enter to submit, Shift+Enter for newline)
 * - Image paste handling via the thread input context
 *
 * **Note:** This component uses refs internally to ensure callbacks stay fresh,
 * so consumers can pass updated providers on each render without worrying about
 * closure issues with the TipTap editor.
 *
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea
 *     placeholder="Type your message..."
 *     resourceProvider={{
 *       search: async (query) => {
 *         // Return custom resources
 *         return [{ id: "foo", name: "Foo" }];
 *       }
 *     }}
 *   />
 * </MessageInput>
 * ```
 */
const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  resourceProvider,
  promptProvider,
  onResourceSelect,
  ...props
}: MessageInputTextareaProps) => {
  // Resource names are extracted from editor at submit time, no need to track in state
  const setResourceNames = React.useCallback(
    (
      _resourceNames:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      // No-op - we extract resource names directly from editor at submit time
    },
    [],
  );

  // Icon factories for MCP items (styled layer provides the icons)
  const resourceFormatOptions = React.useMemo(
    () => ({ createMcpIcon: () => <AtSign className="w-4 h-4" /> }),
    [],
  );
  const promptFormatOptions = React.useMemo(
    () => ({ createMcpIcon: () => <FileText className="w-4 h-4" /> }),
    [],
  );

  // State for MCP prompt fetching (since we can't call hooks inside get())
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  // Handle prompt selection - check if it's an MCP prompt
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  // Handle image paste - mark as pasted and add to thread
  const pendingImagesRef = React.useRef(0);

  return (
    <MessageInputBase.Textarea
      placeholder={placeholder}
      resourceProvider={resourceProvider}
      promptProvider={promptProvider}
      resourceFormatOptions={resourceFormatOptions}
      promptFormatOptions={promptFormatOptions}
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      render={(
        _props,
        {
          value,
          setValue,
          handleSubmit,
          editorRef,
          disabled,
          addImage,
          images,
          setImageError,
          resourceItems,
          setResourceSearch,
          promptItems,
          setPromptSearch,
        },
      ) => {
        // Handle image paste - mark as pasted and add to thread
        const handleAddImage = async (file: File) => {
          if (images.length + pendingImagesRef.current >= MAX_IMAGES) {
            setImageError(`Max ${MAX_IMAGES} uploads at a time`);
            return;
          }
          setImageError(null);
          pendingImagesRef.current += 1;
          try {
            file[IS_PASTED_IMAGE] = true;
            await addImage(file);
          } finally {
            pendingImagesRef.current -= 1;
          }
        };

        return (
          <>
            <McpPromptEffect
              selectedMcpPromptName={selectedMcpPromptName}
              selectedMcpPromptData={selectedMcpPromptData}
              editorRef={editorRef}
              setValue={setValue}
              onComplete={() => setSelectedMcpPromptName(null)}
            />
            <TextEditor
              ref={editorRef as React.RefObject<TamboEditor>}
              value={value}
              onChange={setValue}
              onResourceNamesChange={setResourceNames}
              onSubmit={handleSubmit}
              onAddImage={handleAddImage}
              placeholder={placeholder}
              disabled={disabled}
              className="bg-background text-foreground"
              onSearchResources={setResourceSearch}
              resources={resourceItems}
              onSearchPrompts={setPromptSearch}
              prompts={promptItems}
              onResourceSelect={onResourceSelect ?? noop}
              onPromptSelect={handlePromptSelect}
            />
          </>
        );
      }}
      {...props}
    />
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Helper component to handle MCP prompt insertion effect.
 * Extracted to avoid hooks-in-render-prop issues.
 */
interface McpPromptEffectProps {
  selectedMcpPromptName: string | null;
  selectedMcpPromptData:
    | { messages?: Array<{ content?: { type: string; text?: string } }> }
    | null
    | undefined;
  editorRef: React.RefObject<TamboEditor | null>;
  setValue: (value: string) => void;
  onComplete: () => void;
}

const McpPromptEffect: React.FC<McpPromptEffectProps> = ({
  selectedMcpPromptName,
  selectedMcpPromptData,
  editorRef,
  setValue,
  onComplete,
}) => {
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = selectedMcpPromptData?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg) => {
            if (msg.content?.type === "text") {
              return msg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.setContent(promptText);
          setValue(promptText);
          editor.focus("end");
        }
      }
      onComplete();
    }
  }, [
    selectedMcpPromptData,
    selectedMcpPromptName,
    editorRef,
    setValue,
    onComplete,
  ]);

  return null;
};

/**
 * Props for the legacy plain textarea message input component.
 * This preserves the original MessageInput.Textarea API for backward compatibility.
 */
export interface MessageInputPlainTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Legacy textarea-based message input component.
 *
 * This mirrors the previous MessageInput.Textarea implementation using a native
 * `<textarea>` element. It remains available as an opt-in escape hatch for
 * consumers that relied on textarea-specific props or refs.
 */
const MessageInputPlainTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputPlainTextareaProps) => {
  return (
    <MessageInputBase.Textarea
      placeholder={placeholder}
      render={(
        _props,
        {
          value,
          setValue,
          submitMessage,
          disabled,
          addImage,
          images,
          setImageError,
        },
      ) => {
        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setValue(e.target.value);
        };

        const handleKeyDown = async (
          e: React.KeyboardEvent<HTMLTextAreaElement>,
        ) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              await submitMessage();
            }
          }
        };

        const handlePaste = async (
          e: React.ClipboardEvent<HTMLTextAreaElement>,
        ) => {
          const { imageItems, hasText } = getImageItems(e.clipboardData);

          if (imageItems.length === 0) {
            return; // Allow default text paste
          }

          if (!hasText) {
            e.preventDefault(); // Only prevent when image-only paste
          }

          const totalImages = images.length + imageItems.length;
          if (totalImages > MAX_IMAGES) {
            setImageError(`Max ${MAX_IMAGES} uploads at a time`);
            return;
          }
          setImageError(null);

          for (const item of imageItems) {
            try {
              // Mark this image as pasted so we can show "Image 1", "Image 2", etc.
              item[IS_PASTED_IMAGE] = true;
              await addImage(item);
            } catch (error) {
              console.error("Failed to add pasted image:", error);
            }
          }
        };

        return (
          <textarea
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={cn(
              "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-20.5 max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
              className,
            )}
            disabled={disabled}
            placeholder={placeholder}
            aria-label="Chat Message Input"
            data-slot="message-input-textarea"
            {...props}
          />
        );
      }}
    />
  );
};
MessageInputPlainTextarea.displayName = "MessageInput.PlainTextarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const buttonClasses = cn(
    "w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <MessageInputBase.SubmitButton
      ref={ref}
      className={buttonClasses}
      render={(_props, { showCancelButton }) => (
        <>
          {children ??
            (showCancelButton ? (
              <Square className="w-4 h-4" fill="currentColor" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            ))}
        </>
      )}
      {...props}
    />
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      color="#000000"
      fill="none"
    >
      <path
        d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};
/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInput.McpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <>
      <Tooltip content="Configure MCP Servers" side="right">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  return (
    <MessageInputBase.Error
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      {...props}
    />
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 * @component MessageInput.FileButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
      <MessageInputBase.FileButton
        ref={ref}
        accept={accept}
        multiple={multiple}
        className={buttonClasses}
        {...props}
      >
        <Paperclip className="w-4 h-4" />
      </MessageInputBase.FileButton>
    </Tooltip>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * Wraps McpPromptButton and connects it to MessageInput context.
 * @component MessageInput.McpPromptButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ ...props }, ref) => {
  return (
    <MessageInputBase.ValueAccess>
      {({ value, setValue }) => (
        <McpPromptButton
          ref={ref}
          {...props}
          value={value}
          onInsertText={setValue}
        />
      )}
    </MessageInputBase.ValueAccess>
  );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";

/**
 * Props for the MessageInputMcpResourceButton component.
 */
export type MessageInputMcpResourceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Resource picker button component for inserting resource references from MCP servers.
 * Wraps McpResourceButton and connects it to MessageInput context.
 * @component MessageInput.McpResourceButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.McpResourceButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpResourceButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpResourceButtonProps
>(({ ...props }, ref) => {
  return (
    <MessageInputBase.ValueAccess>
      {({ value, setValue, editorRef }) => {
        const insertResourceReference = (id: string, label: string) => {
          const editor = editorRef.current;
          if (editor) {
            editor.insertMention(id, label);
            setValue(editor.getTextWithResourceURIs().text);
            return;
          }
          // Fallback: append to end of plain text value
          const newValue = value ? `${value} ${id}` : id;
          setValue(newValue);
        };

        return (
          <McpResourceButton
            ref={ref}
            {...props}
            value={value}
            onInsertResource={insertResourceReference}
          />
        );
      }}
    </MessageInputBase.ValueAccess>
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";

/**
 * ContextBadge component that displays a staged image with expandable preview.
 * Shows a compact badge with icon and name by default, expands to show image preview on click.
 *
 * @component
 * @example
 * ```tsx
 * <ImageContextBadge
 *   image={stagedImage}
 *   displayName="Image"
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   onRemove={() => removeImage(image.id)}
 * />
 * ```
 */
const ImageContextBadge: React.FC<StagedImageRenderProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.dataUrl}
              alt={displayName}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

/**
 * Props for the MessageInputStagedImages component.
 */
export type MessageInputStagedImagesProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays currently staged images with preview and remove functionality.
 * @component MessageInput.StagedImages
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.StagedImages />
 *   <MessageInput.Textarea />
 * </MessageInput>
 * ```
 */
const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  return (
    <MessageInputBase.StagedImages
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border empty:hidden",
        className,
      )}
      render={(_props, { images }) => (
        <>
          {images.map(({ image, ...props }) => (
            <ImageContextBadge key={image.id} image={image} {...props} />
          ))}
        </>
      )}
      {...props}
    />
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Convenience wrapper that renders staged images as context badges.
 * Keeps API parity with the web app's MessageInputContexts component.
 */
const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <MessageInputStagedImages
    ref={ref}
    className={cn("pb-2 pt-1 border-b border-border", className)}
    {...props}
  />
));
MessageInputContexts.displayName = "MessageInputContexts";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className,
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Left side - everything except submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; // Don't render submit button here
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        <DictationButton />
        {/* Right side - only submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; // Only render submit button here
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  DictationButton,
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputPlainTextarea,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};

// Re-export types from text-editor for convenience
export type { PromptItem, ResourceItem } from "./text-editor";
