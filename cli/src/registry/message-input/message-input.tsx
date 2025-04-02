"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
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
  HTMLInputElement,
  MessageInputProps
>(({ className, variant, contextKey, ...props }, ref) => {
  const { value, setValue, submit, isPending, error } =
    useTamboThreadInput(contextKey);
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle the forwarded ref
  React.useImperativeHandle(ref, () => inputRef.current!, []);

  React.useEffect(() => {
    setDisplayValue(value);
    // Focus the input when value changes and is not empty
    if (value && inputRef.current) {
      inputRef.current.focus();
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const modKey = isMac ? "⌘" : "Ctrl";

  const Spinner = () => (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(messageInputVariants({ variant }), className)}
      {...props}
    >
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 rounded-lg border bg-background text-foreground border-border"
          disabled={isPending}
          placeholder="Type your message..."
          aria-label="Chat Message Input"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center min-w-[70px]"
        >
          {isPending ? <Spinner /> : "Send"}
        </button>
      </div>
      <div className="flex flex-col items-center mt-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>Press</span>
          <kbd
            className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-xs"
            suppressHydrationWarning
          >
            {modKey}
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-xs">
            Enter
          </kbd>
          <span>to send</span>
        </div>
        {(error ?? submitError) && (
          <p className="text-sm text-[hsl(var(--destructive))] mt-1">
            {error?.message ?? submitError}
          </p>
        )}
      </div>
    </form>
  );
});
MessageInput.displayName = "MessageInput";

export { messageInputVariants };
