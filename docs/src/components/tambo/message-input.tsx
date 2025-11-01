"use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import { McpConfigModal } from "@/components/tambo/mcp-config-modal";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
  type StagedAttachment,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";

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
        "[&>div]:rounded-3xl",
        "[&>div]:shadow-xs",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-3xl",
        "[&_textarea]:min-h-[44px]",
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
 * @property {StagedAttachment[]} attachments - Currently staged attachments
 * @property {HTMLTextAreaElement|null} textareaRef - Reference to the textarea element
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
export interface MessageInputContextValue {
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
  attachments: StagedAttachment[];
  addAttachment: (file: File) => Promise<StagedAttachment>;
  addAttachments: (files: File[]) => Promise<StagedAttachment[]>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
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
  /** Optional initial query to populate the input with. */
  initialQuery?: string;
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
 *   <MessageInputTextarea />
 *   <MessageInputSubmitButton />
 *   <MessageInputError />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  (
    { children, className, contextKey, variant, initialQuery, ...props },
    ref,
  ) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        contextKey={contextKey}
        variant={variant}
        initialQuery={initialQuery}
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
>(
  (
    {
      children,
      className,
      contextKey,
      variant,
      inputRef,
      initialQuery,
      ...props
    },
    ref,
  ) => {
    const {
      value,
      setValue,
      submit,
      isPending,
      error,
      attachments,
      addAttachment,
      addAttachments,
      removeAttachment,
      clearAttachments,
    } = useTamboThreadInput();
    const { cancel } = useTamboThread();
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const dragCounter = React.useRef(0);
    const [appliedInitialQuery, setAppliedInitialQuery] = React.useState<
      string | null
    >(null);

    // Use elicitation context (optional)
    const { elicitation, resolveElicitation } = useTamboElicitationContext();

    React.useEffect(() => {
      setDisplayValue(value);
      if (value && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [value]);

    React.useEffect(() => {
      if (!initialQuery) {
        setAppliedInitialQuery(null);
        return;
      }
      if (appliedInitialQuery === initialQuery) {
        return;
      }

      setAppliedInitialQuery(initialQuery);
      setValue(initialQuery);
      setDisplayValue(initialQuery);
    }, [initialQuery, appliedInitialQuery, setValue, setDisplayValue]);

    const handleSubmit = React.useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!value.trim() && attachments.length === 0) || isSubmitting) return;

        setSubmitError(null);
        setDisplayValue("");
        setIsSubmitting(true);

        // Clear images in next tick for immediate UI feedback
        if (attachments.length > 0) {
          setTimeout(() => clearAttachments(), 0);
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
        attachments,
        clearAttachments,
      ],
    );

    const handleDragEnter = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const hasFiles = Array.from(e.dataTransfer.items).some(
          (item) => item.kind === "file",
        );
        if (hasFiles) {
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

        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) {
          try {
            await addAttachments(files);
          } catch (error) {
            console.error("Failed to add dropped attachments:", error);
          }
        }
      },
      [addAttachments],
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
        attachments,
        addAttachment,
        addAttachments,
        removeAttachment,
        clearAttachments,
        textareaRef: inputRef ?? textareaRef,
        submitError,
        setSubmitError,
        elicitation,
        resolveElicitation: resolveElicitation ?? null,
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
        attachments,
        addAttachment,
        addAttachments,
        removeAttachment,
        clearAttachments,
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
              "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3 cursor-text",
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
                <MessageInputAttachments />
                {children}
              </>
            )}
          </div>
        </form>
      </MessageInputContext.Provider>
    );
  },
);
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Symbol for marking pasted attachments
 */
const IS_PASTED_ATTACHMENT = Symbol("is-pasted-attachment");

/**
 * Extend the File interface to include IS_PASTED_ATTACHMENT symbol
 */
declare global {
  interface File {
    [IS_PASTED_ATTACHMENT]?: boolean;
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
 * @component MessageInputTextarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea placeholder="Type your message..." />
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
  const { addAttachment } = useTamboThreadInput();
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
          file[IS_PASTED_ATTACHMENT] = true;
          await addAttachment(file);
        } catch (error) {
          console.error("Failed to add pasted attachment:", error);
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
MessageInputTextarea.displayName = "MessageInputTextarea";

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
 * @component MessageInputSubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInputSubmitButton />
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
MessageInputSubmitButton.displayName = "MessageInputSubmitButton";

/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInputMcpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <MessageInputToolbar>
 *     <MessageInputMcpConfigButton />
 *     <MessageInputSubmitButton />
 *   </MessageInputToolbar>
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
    "w-10 h-10 bg-muted text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
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
        className="bg-muted text-foreground"
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
MessageInputMcpConfigButton.displayName = "MessageInputMcpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInputError
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <MessageInputSubmitButton />
 *   <MessageInputError />
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
MessageInputError.displayName = "MessageInputError";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Optional custom icon to render instead of the default Paperclip. */
  icon?: React.ReactNode;
}

/**
 * File attachment button component for selecting images from file system.
 * @component MessageInputFileButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <MessageInputToolbar>
 *     <MessageInputFileButton />
 *     <MessageInputSubmitButton />
 *   </MessageInputToolbar>
 * </MessageInput>
 * ```
 */
const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, icon, ...props }, ref) => {
  const { addAttachments } = useTamboThreadInput();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isImageOnly = accept === "image/*";

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    try {
      await addAttachments(files);
    } catch (error) {
      console.error("Failed to add selected attachments:", error);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-muted text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip
        content={isImageOnly ? "Attach Images" : "Attach Files"}
        side="top"
        className="bg-muted text-foreground"
      >
        <button
          ref={ref}
          type="button"
          onClick={handleClick}
          className={buttonClasses}
          aria-label={isImageOnly ? "Attach Images" : "Attach Files"}
          data-slot="message-input-file-button"
          {...props}
        >
          {icon ?? <Paperclip className="w-4 h-4" />}
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
MessageInputFileButton.displayName = "MessageInputFileButton";

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * @component MessageInputMcpPromptButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <MessageInputToolbar>
 *     <MessageInputFileButton />
 *     <MessageInputMcpPromptButton />
 *     <MessageInputSubmitButton />
 *   </MessageInputToolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ className, ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  const { data: promptList, isLoading } = useTamboMcpPromptList();
  const [selectedPromptName, setSelectedPromptName] = React.useState<
    string | null
  >(null);
  const { data: promptData } = useTamboMcpPrompt(selectedPromptName ?? "");

  // When prompt data is fetched, insert it into the input
  React.useEffect(() => {
    if (promptData && selectedPromptName) {
      // Extract the text from the prompt messages
      const promptText = promptData.messages
        .map((msg) => {
          if (msg.content.type === "text") {
            return msg.content.text;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      // Insert the prompt text, appending to existing value if any
      const newValue = value ? `${value}\n\n${promptText}` : promptText;
      setValue(newValue);

      // Reset the selected prompt
      setSelectedPromptName(null);
    }
  }, [promptData, selectedPromptName, setValue, value]);

  // Only show button if prompts are available (hide during loading and when no prompts)
  if (!promptList || promptList.length === 0) {
    return null;
  }

  const buttonClasses = cn(
    "w-10 h-10 bg-muted text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip
        content="Insert MCP Prompt"
        side="top"
        className="bg-muted text-foreground"
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={buttonClasses}
              aria-label="Insert MCP Prompt"
              data-slot="message-input-mcp-prompt-button"
              {...props}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] max-w-[300px] overflow-hidden rounded-md border border-gray-200 bg-popover p-1 text-popover-foreground shadow-md"
              side="top"
              align="start"
              sideOffset={5}
            >
              {isLoading ? (
                <DropdownMenu.Item
                  className="px-2 py-1.5 text-sm text-muted-foreground"
                  disabled
                >
                  Loading prompts...
                </DropdownMenu.Item>
              ) : !promptList || promptList.length === 0 ? (
                <DropdownMenu.Item
                  className="px-2 py-1.5 text-sm text-muted-foreground"
                  disabled
                >
                  No prompts available
                </DropdownMenu.Item>
              ) : (
                promptList.map((promptEntry) => (
                  <DropdownMenu.Item
                    key={`${promptEntry.server.url}-${promptEntry.prompt.name}`}
                    className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    onSelect={() => {
                      setSelectedPromptName(promptEntry.prompt.name);
                    }}
                  >
                    <span className="font-medium truncate max-w-full">
                      {promptEntry.prompt.name}
                    </span>
                    {promptEntry.prompt.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-full">
                        {promptEntry.prompt.description}
                      </span>
                    )}
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Tooltip>
    </TooltipProvider>
  );
});
MessageInputMcpPromptButton.displayName = "MessageInputMcpPromptButton";

/**
 * Props for the AttachmentBadge component.
 */
interface AttachmentBadgeProps {
  attachment: StagedAttachment;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * Badge component that displays a staged attachment with optional expandable preview.
 * Images render a visual preview; other attachment types render a compact badge.
 */
const AttachmentBadge: React.FC<AttachmentBadgeProps> = ({
  attachment,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => {
  const previewSrc = attachment.previewUrl ?? attachment.dataUrl;
  // Only image attachments are supported today. When adding new file types,
  // replace this early return with rendering logic for each supported kind.
  if (attachment.kind !== "image") {
    return null;
  }

  return (
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
                src={previewSrc}
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
};

/**
 * Props for the MessageInputAttachments component.
 */
export type MessageInputAttachmentsProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays currently staged attachments with preview and remove functionality.
 */
const MessageInputAttachments = React.forwardRef<
  HTMLDivElement,
  MessageInputAttachmentsProps
>(({ className, ...props }, ref) => {
  const { attachments, removeAttachment } = useTamboThreadInput();
  const [expandedAttachmentId, setExpandedAttachmentId] = React.useState<
    string | null
  >(null);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-attachments"
      data-legacy-slot="message-input-staged-images"
      {...props}
    >
      {attachments.map((attachment, index) => {
        const displayName = attachment.name ?? `Image ${index + 1}`;

        return (
          <AttachmentBadge
            key={attachment.id}
            attachment={attachment}
            displayName={displayName}
            isExpanded={expandedAttachmentId === attachment.id}
            onToggle={() => {
              setExpandedAttachmentId((current) =>
                current === attachment.id ? null : attachment.id,
              );
            }}
            onRemove={() => removeAttachment(attachment.id)}
          />
        );
      })}
    </div>
  );
});
MessageInputAttachments.displayName = "MessageInputAttachments";

/**
 * @deprecated Use MessageInputAttachments instead.
 */
const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputAttachmentsProps
>((props, ref) => <MessageInputAttachments ref={ref} {...props} />);
MessageInputStagedImages.displayName = "MessageInputStagedImages";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInputToolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInputTextarea />
 *   <MessageInputToolbar>
 *     <MessageInputMcpConfigButton />
 *     <MessageInputSubmitButton />
 *   </MessageInputToolbar>
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
MessageInputToolbar.displayName = "MessageInputToolbar";

/**
 * Props for MessageInputActions.
 */
export interface MessageInputActionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Alternative to MessageInputToolbar with simpler styling.
 * Provides a clean container for action buttons.
 */
const MessageInputActions = React.forwardRef<
  HTMLDivElement,
  MessageInputActionsProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      data-slot="message-input-actions"
      {...props}
    >
      {children}
    </div>
  );
});
MessageInputActions.displayName = "MessageInputActions";

// --- Exports ---
export {
  MessageInput,
  MessageInputActions,
  MessageInputAttachments,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputStagedImages,
  messageInputVariants,
  useMessageInputContext,
};
