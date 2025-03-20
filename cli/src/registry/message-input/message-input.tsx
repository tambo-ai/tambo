"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";

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

const MessageInput = React.forwardRef<HTMLInputElement, MessageInputProps>(
  ({ className, variant, contextKey, ...props }, ref) => {
    const { value, setValue, submit, isPending, error } =
      useTamboThreadInput(contextKey);
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;

      setSubmitError(null);
      try {
        await submit({
          contextKey,
          streamResponse: true,
        });
      } catch (error) {
        console.error("Failed to submit message:", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        );
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        {...props}
      >
        <div className="flex gap-2">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 p-2 rounded-lg border bg-background text-foreground border-border"
            disabled={isPending}
            placeholder="Type your message..."
            aria-label="Chat Message Input"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "..." : "Send"}
          </button>
        </div>
        {(error ?? submitError) && (
          <p className="text-sm text-[hsl(var(--destructive))] mt-1">
            {error?.message ?? submitError}
          </p>
        )}
      </form>
    );
  },
);
MessageInput.displayName = "MessageInput";

export { MessageInput, messageInputVariants };
