"use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@/components/tambo/mcp-components";
import { McpConfigModal } from "@/components/tambo/mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
  type StagedImage,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  Image as ImageIcon,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import * as React from "react";
// eslint-disable-next-line @typescript-eslint/promise-function-async
const DictationButton = dynamic(() => import("./dictation-button"), {
  ssr: false,
});

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
 * @property {HTMLTextAreaElement|null} textareaRef - Reference to the textarea element
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
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
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
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
export interface MessageInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  /** The context key identifying which thread to send messages to. */
  contextKey?: string;
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the textarea element. */
  inputRef?: React.RefObject<HTMLTextAreaElement>;
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
        <TooltipProvider>{children}</TooltipProvider>
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
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const dragCounter = React.useRef(0);

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    setDisplayValue(value);
    if (value && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      setSubmitError(null);
      setDisplayValue("");
      setIsSubmitting(true);

      // Clear images in next tick for immediate UI feedback
      if (images.length > 0) {
        setTimeout(() => clearImages(), 0);
      }

      try {
        await submit({
          contextKey,
          streamResponse: true,
        });
        setValue("");
        // Images are cleared automatically by the TamboThreadInputProvider
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
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

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      // Calling resolveElicitation automatically clears the elicitation state
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
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
      textareaRef: inputRef ?? textareaRef,
      submitError,
      setSubmitError,
      elicitation,
      resolveElicitation,
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
      textareaRef,
      submitError,
      elicitation,
      resolveElicitation,
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
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Symbol for marking pasted images
 */
const IS_PASTED_IMAGE = Symbol("is-pasted-image");

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Textarea component for entering message text.
 * Automatically connects to the context to handle value changes and key presses.
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
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, textareaRef, handleSubmit } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    // Allow default paste if there is text, even when images exist
    const hasText = e.clipboardData.getData("text/plain").length > 0;

    if (imageItems.length === 0) {
      return; // Allow default text paste
    }

    if (!hasText) {
      e.preventDefault(); // Only prevent when image-only paste
    }

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        try {
          // Mark this file as pasted so we can show "Image 1", "Image 2", etc.
          file[IS_PASTED_IMAGE] = true;
          await addImage(file);
        } catch (error) {
          console.error("Failed to add pasted image:", error);
        }
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
export interface MessageInputFileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
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
  const { setValue, value } = useMessageInputContext();
  return (
    <McpPromptButton
      ref={ref}
      {...props}
      value={value as string}
      onInsertText={setValue}
    />
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
  const { setValue, value } = useMessageInputContext();
  return (
    <McpResourceButton
      ref={ref}
      {...props}
      value={value as string}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";

/**
 * Props for the ImageContextBadge component.
 */
interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

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
const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0">
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
            <Image
              src={image.dataUrl}
              alt={displayName}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
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
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

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
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};
