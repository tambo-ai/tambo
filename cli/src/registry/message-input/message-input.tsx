"use client";

import { cn } from "@/lib/utils";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp, Square } from "lucide-react";
import * as React from "react";
import { McpConfigModal } from "@/components/ui/mcp-config-modal";
import { Tooltip, TooltipProvider } from "@/components/ui/suggestions-tooltip";

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
    const { value, setValue, submit, isPending, error } =
      useTamboThreadInput(contextKey);
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      setDisplayValue(value);
      if (value && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [value]);

    const handleSubmit = React.useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setSubmitError(null);
        setDisplayValue("");
        try {
          await submit({
            contextKey,
            streamResponse: true,
          });
          setValue("");
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
        }
      },
      [value, submit, contextKey, setValue, setDisplayValue, setSubmitError],
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
        isPending,
        error,
        contextKey,
        textareaRef,
        submitError,
        setSubmitError,
      }),
      [
        displayValue,
        setValue,
        submit,
        handleSubmit,
        isPending,
        error,
        contextKey,
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
          {...props}
        >
          <div className="flex flex-col border border-gray-200 rounded-xl bg-background shadow-md p-2 px-3">
            {children}
          </div>
        </form>
      </MessageInputContext.Provider>
    );
  },
);
MessageInput.displayName = "MessageInput";

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
  const isPending = !isIdle;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending}
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

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={isPending ? "button" : "submit"}
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
  React.ButtonHTMLAttributes<HTMLButtonElement>
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
        {React.Children.map(children, (child) => {
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
        {React.Children.map(children, (child) => {
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
  MessageInputError,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};
