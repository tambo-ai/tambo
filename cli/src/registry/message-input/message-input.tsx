"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp } from "lucide-react";
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
        "shadow shadow-zinc-900/10 dark:shadow-zinc-900/20",
        "[&_input]:bg-muted [&_input]:dark:bg-muted",
      ].join(" "),
      bordered: ["[&_input]:border-2", "[&_input]:border-border"].join(" "),
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
 * Throws an error if used outside of a MessageInput.Root component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.Root.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput.Root",
    );
  }
  return context;
};

/**
 * Props for the MessageInputRoot component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputRootProps
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
 * @component MessageInput.Root
 * @example
 * ```tsx
 * <MessageInput.Root contextKey="my-thread" variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput.Root>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputRootProps>(
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

    const handleSubmit = async (e: React.FormEvent) => {
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
    };

    const contextValue = React.useMemo(
      () => ({
        value: displayValue,
        setValue: (newValue: string) => {
          setValue(newValue);
          setDisplayValue(newValue);
        },
        submit,
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
 * <MessageInput.Root>
 *   <MessageInput.Textarea placeholder="Type your message..." />
 * </MessageInput.Root>
 * ```
 */
const MessageInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  MessageInputTextareaProps
>(({ className, placeholder = "What do you want to do?", ...props }, _) => {
  const { value, setValue, isPending, textareaRef, submit, contextKey } =
    useMessageInputContext();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        submit({ contextKey, streamResponse: true });
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
});
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
 * <MessageInput.Root>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput.Root>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();

  return (
    <button
      ref={ref}
      type="submit"
      disabled={isPending}
      className={cn(
        "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center cursor-pointer",
        className,
      )}
      aria-label="Send message"
      data-slot="message-input-submit"
      {...props}
    >
      {children ??
        (isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

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
 * <MessageInput.Root>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput.Root>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError } = useMessageInputContext();

  if (!error || !submitError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-[hsl(var(--destructive))] mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Container for the toolbar components (like submit button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput.Root>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput.Root>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex justify-end mt-2 p-1", className)}
      data-slot="message-input-toolbar"
      {...props}
    >
      {children}
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  messageInputVariants,
  MessageInput,
  MessageInputTextarea,
  MessageInputSubmitButton,
  MessageInputToolbar,
  MessageInputError,
};
