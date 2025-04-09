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
 * Props for the MessageInput component
 * @interface
 */
export interface MessageInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional styling variant for the input container */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /**
   * Tambo thread context key for message routing
   * Used to identify which thread the message should be sent to
   */
  contextKey: string | undefined;
}

/**
 * A form component for submitting messages to a Tambo thread with keyboard shortcuts and loading states
 * @component
 * @example
 * ```tsx
 * <MessageInput
 *   contextKey="my-thread"
 *   variant="solid"
 *   className="custom-styles"
 * />
 * ```
 */
export const MessageInput = React.forwardRef<
  HTMLTextAreaElement,
  MessageInputProps
>(({ className, variant, contextKey, ...props }, ref) => {
  const { value, setValue, submit, isPending, error } =
    useTamboThreadInput(contextKey);
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Handle the forwarded ref
  React.useImperativeHandle(ref, () => textareaRef.current!, []);

  React.useEffect(() => {
    setDisplayValue(value);
    // Focus the textarea when value changes and is not empty
    if (value && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setDisplayValue(e.target.value);
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const Spinner = () => (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(messageInputVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-col border border-gray-200 rounded-xl bg-background shadow-md p-2 px-3">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50"
          disabled={isPending}
          placeholder="What do you want to do?"
          aria-label="Chat Message Input"
        />
        <div className="flex justify-end mt-2 p-1">
          <div className="relative group">
            <button
              type="submit"
              disabled={isPending}
              className="w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              aria-label="Send message"
            >
              {isPending ? <Spinner /> : <ArrowUp className="w-5 h-5" />}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 text-xs bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Send message
            </div>
          </div>
        </div>
      </div>
      {(error ?? submitError) && (
        <p className="text-sm text-[hsl(var(--destructive))] mt-2">
          {error?.message ?? submitError}
        </p>
      )}
    </form>
  );
});
MessageInput.displayName = "MessageInput";

export { messageInputVariants };
