"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

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
 * A form component for submitting messages to a Tambo thread
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof messageInputVariants>["variant"]} variant - Optional styling variant
 * @property {string | undefined} contextKey - Tambo thread context key for message routing
 */

export interface MessageInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  contextKey: string | undefined;
}

const MessageInput = React.forwardRef<HTMLTextAreaElement, MessageInputProps>(
  ({ className, variant, contextKey, ...props }, ref) => {
    const { value, setValue, submit, isPending, error } =
      useTamboThreadInput(contextKey);
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    React.useEffect(() => {
      setDisplayValue(value);
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
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
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
        <div className="flex flex-col border rounded-xl bg-background shadow">
          <textarea
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[72px] max-h-[200px] focus:outline-none"
            disabled={isPending}
            placeholder="Type your message..."
            aria-label="Chat Message Input"
            rows={3}
          />
          <div className="flex items-center justify-between p-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center min-w-[70px]"
            >
              {isPending ? <Spinner /> : "Send"}
            </button>
          </div>
        </div>
        {(error ?? submitError) && (
          <p className="text-sm text-[hsl(var(--destructive))] mt-2">
            {error?.message ?? submitError}
          </p>
        )}
      </form>
    );
  },
);
MessageInput.displayName = "MessageInput";

export { MessageInput, messageInputVariants };
