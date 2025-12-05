"use client";

import { ContextAttachmentBadgeList } from "@/components/ui/tambo/context-attachment-badge";
import { McpConfigModal } from "@/components/ui/tambo/mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/ui/tambo/suggestions-tooltip";
import {
  TextEditor,
  type PromptItem,
  type ResourceItem,
} from "@/components/ui/tambo/text-editor";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboContextAttachment,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import {
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
} from "@tambo-ai/react/mcp";
import type { Editor } from "@tiptap/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp, AtSign, FileText, Paperclip, Square } from "lucide-react";
import * as React from "react";

/**
 * Provider interface for searching resources (for "@" mentions).
 * Empty query string "" should return all available resources.
 */
export interface ResourceProvider {
  /** Search for resources matching the query */
  search(query: string): Promise<ResourceItem[]>;
}

/**
 * Provider interface for searching and fetching prompts (for "/" commands).
 * Empty query string "" should return all available prompts.
 */
export interface PromptProvider {
  /** Search for prompts matching the query */
  search(query: string): Promise<PromptItem[]>;
  /** Get the full prompt details including text by ID */
  get(id: string): Promise<PromptItem>;
}

/**
 * Symbol for marking pasted images.
 * Using Symbol.for to create a global symbol that can be accessed across modules.
 * @internal
 */
const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

/**
 * Extend the File interface to include the IS_PASTED_IMAGE property.
 * This is a type-safe way to mark pasted images without using a broad index signature.
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Removes duplicate resource items based on ID.
 */
const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Filters resource items by query string.
 * Empty query returns all items.
 */
const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Filters prompt items by query string.
 * Empty query returns all items.
 */
const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Hook to create a combined resource provider that merges MCP resources with an external provider.
 * Returns a stable ResourceProvider that searches both sources.
 */
function useCombinedResourceProvider(
  externalProvider: ResourceProvider | undefined,
): ResourceProvider {
  const { data: mcpResources } = useTamboMcpResourceList();

  return React.useMemo<ResourceProvider>(
    () => ({
      search: async (query: string): Promise<ResourceItem[]> => {
        try {
          // Get MCP resources
          const mcpItems: ResourceItem[] = mcpResources
            ? (
                mcpResources as {
                  resource: { uri: string; name?: string };
                }[]
              ).map((entry) => ({
                id: `mcp-resource:${entry.resource.uri}`,
                name: entry.resource.name ?? entry.resource.uri,
                icon: React.createElement(AtSign, { className: "w-4 h-4" }),
                componentData: { type: "mcp-resource", data: entry },
              }))
            : [];

          // Get external resources
          const externalItems = externalProvider
            ? await externalProvider.search(query)
            : [];

          // Combine and dedupe
          const combined = [...mcpItems, ...externalItems];
          const filtered = filterResourceItems(combined, query);
          return dedupeResourceItems(filtered);
        } catch (error) {
          console.error("Failed to fetch resources", error);
          return [];
        }
      },
    }),
    [mcpResources, externalProvider],
  );
}

/**
 * Hook to create a combined prompt provider that merges MCP prompts with an external provider.
 * Returns a stable PromptProvider that searches both sources and fetches prompt details.
 *
 * Note: MCP prompts are marked with a special ID prefix so they can be handled separately
 * via the useTamboMcpPrompt hook (since we can't call hooks inside get()).
 */
function useCombinedPromptProvider(
  externalProvider: PromptProvider | undefined,
): PromptProvider {
  const { data: mcpPrompts } = useTamboMcpPromptList();

  return React.useMemo<PromptProvider>(
    () => ({
      search: async (query: string): Promise<PromptItem[]> => {
        try {
          // Get MCP prompts (mark with mcp-prompt: prefix so we know to handle them specially)
          const mcpItems: PromptItem[] = mcpPrompts
            ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
                id: `mcp-prompt:${entry.prompt.name}`,
                name: entry.prompt.name,
                icon: React.createElement(FileText, { className: "w-4 h-4" }),
                text: "", // Text will be fetched when selected via useTamboMcpPrompt
              }))
            : [];

          // Get external prompts
          const externalItems = externalProvider
            ? await externalProvider.search(query)
            : [];

          // Combine and filter
          const combined = [...mcpItems, ...externalItems];
          return filterPromptItems(combined, query);
        } catch (error) {
          console.error("Failed to fetch prompts", error);
          return [];
        }
      },
      get: async (id: string): Promise<PromptItem> => {
        // Check if this is an MCP prompt (marked with mcp-prompt: prefix)
        if (id.startsWith("mcp-prompt:")) {
          // Return a placeholder - actual text will be fetched via useTamboMcpPrompt hook
          const promptName = id.replace("mcp-prompt:", "");
          return {
            id,
            name: promptName,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            text: "", // Will be populated by MCP hook
          };
        }

        // Delegate to external provider
        if (externalProvider) {
          return await externalProvider.get(id);
        }

        throw new Error(`Prompt not found: ${id}`);
      },
    }),
    [mcpPrompts, externalProvider],
  );
}

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
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
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {string|undefined} contextKey - The thread context key
 * @property {Editor|null} editorRef - Reference to the TipTap editor instance
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 */
interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    contextKey?: string;
    streamResponse?: boolean;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  contextKey?: string;
  editorRef: React.RefObject<Editor | null>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** The context key identifying which thread to send messages to. */
  contextKey?: string;
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the TipTap editor instance. */
  inputRef?: React.RefObject<Editor | null>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput contextKey="my-thread" variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, contextKey, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        contextKey={contextKey}
        variant={variant}
        {...props}
      >
        {children}
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";

/**
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, contextKey, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    clearImages,
  } = useTamboThreadInput();
  const { cancel } = useTamboThread();
  const { attachments, clearContextAttachments } = useTamboContextAttachment();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<Editor | null>(null);
  const dragCounter = React.useRef(0);

  React.useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      setSubmitError(null);
      setDisplayValue("");
      setIsSubmitting(true);

      // Clear images and component contexts in next tick for immediate UI feedback
      if (images.length > 0) {
        setTimeout(() => clearImages(), 0);
      }
      if (attachments.length > 0) {
        setTimeout(() => clearContextAttachments(), 0);
      }

      try {
        await submit({
          contextKey,
          streamResponse: true,
        });
        setValue("");
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        );

        // Cancel the thread to reset loading state
        await cancel();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      contextKey,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancel,
      isSubmitting,
      images,
      clearImages,
      attachments,
      clearContextAttachments,
    ],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        try {
          await addImages(files);
        } catch (error) {
          console.error("Failed to add dropped images:", error);
        }
      }
    },
    [addImages],
  );

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(newValue);
        setDisplayValue(newValue);
      },
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
      error,
      contextKey,
      editorRef: inputRef ?? editorRef,
      submitError,
      setSubmitError,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      contextKey,
      inputRef,
      editorRef,
      submitError,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {children}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Props for the MessageInputTextarea component.
 */
export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom placeholder text. */
  placeholder?: string;
  /** Resource provider for @ mentions (optional) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional) */
  promptProvider?: PromptProvider;
  /** Callback when a resource is selected from @ mentions (optional) */
  onResourceSelect?: (item: ResourceItem) => void;
}

/**
 * Textarea component for entering message text with @ mention and / command support.
 *
 * Uses the TipTap-based TextEditor component which provides:
 * - @ mention autocomplete via resourceProvider
 * - / command autocomplete via promptProvider
 * - Keyboard navigation (Enter to submit, Shift+Enter for newline)
 * - Image paste support
 *
 * **Note:** This component uses refs internally to ensure callbacks stay fresh,
 * so consumers can pass updated providers on each render without worrying about
 * closure issues with the TipTap editor.
 *
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea placeholder="Type your message..." />
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
  const { value, setValue, handleSubmit, editorRef } = useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();

  // Combine MCP resources/prompts with external providers
  const combinedResourceProvider =
    useCombinedResourceProvider(resourceProvider);
  const combinedPromptProvider = useCombinedPromptProvider(promptProvider);

  // State for MCP prompt fetching (since we can't call hooks inside get())
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  // Handle MCP prompt insertion when data is fetched
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = (selectedMcpPromptData as { messages?: unknown[] })
        ?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg: unknown) => {
            const typedMsg = msg as {
              content?: { type?: string; text?: string };
            };
            if (typedMsg.content?.type === "text") {
              return typedMsg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.commands.setContent(promptText);
          setValue(promptText);
          editor.commands.focus("end");
        }
      }
      setSelectedMcpPromptName(null);
    }
  }, [selectedMcpPromptData, selectedMcpPromptName, editorRef, setValue]);

  // Handle prompt selection - check if it's an MCP prompt
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  // Handle image paste - mark as pasted and add to thread
  const handleAddImage = React.useCallback(
    async (file: File) => {
      file[IS_PASTED_IMAGE] = true;
      await addImage(file);
    },
    [addImage],
  );

  return (
    <div
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      {...props}
    >
      <TextEditor
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onAddImage={handleAddImage}
        placeholder={placeholder}
        disabled={!isIdle || isUpdatingToken}
        editorRef={editorRef}
        className="bg-background text-foreground"
        onSearchResources={combinedResourceProvider.search}
        onSearchPrompts={combinedPromptProvider.search}
        onResourceSelect={onResourceSelect ?? (() => {})}
        onPromptSelect={handlePromptSelect}
      />
    </div>
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

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
  const { isPending } = useMessageInputContext();
  const { cancel } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={isPending ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={isPending ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={isPending ? "Cancel message" : "Send message"}
      data-slot={isPending ? "message-input-cancel" : "message-input-submit"}
      {...props}
    >
      {children ??
        (isPending ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

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
    "w-10 h-10 bg-muted text-primary rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className,
  );

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

  return (
    <TooltipProvider>
      <Tooltip
        content="Configure MCP Servers"
        side="right"
        className="bg-muted text-primary"
      >
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
    </TooltipProvider>
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
  const { error, submitError } = useMessageInputContext();

  if (!error && !submitError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError}
    </p>
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
  const { addImages } = useTamboThreadInput();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    try {
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-muted text-primary rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip
        content="Attach Images"
        side="top"
        className="bg-muted text-primary"
      >
        <button
          ref={ref}
          type="button"
          onClick={handleClick}
          className={buttonClasses}
          aria-label="Attach Images"
          data-slot="message-input-file-button"
          {...props}
        >
          <Paperclip className="w-4 h-4" />
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </button>
      </Tooltip>
    </TooltipProvider>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";

/**
 * Unified component that displays ALL contexts: staged images and component contexts.
 * This is the single component you need - it handles everything automatically.
 * Hides itself when there are no contexts to show.
 *
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputContexts />
 *   <MessageInputTextarea />
 * </MessageInput>
 * ```
 */
const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ContextAttachmentBadgeList
    ref={ref}
    showRemoveButtons
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
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};

// Re-export types from text-editor for convenience
export type {
  PromptItem,
  ResourceItem,
} from "@/components/ui/tambo/text-editor";
