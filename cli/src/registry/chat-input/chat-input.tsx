"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";

const chatInputVariants = cva("w-full", {
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
 * Represents a chat input component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof chatInputVariants>["variant"]} variant - Optional variant for custom styling
 */

export interface ChatInputProps extends React.HTMLAttributes<HTMLFormElement> {
  variant?: VariantProps<typeof chatInputVariants>["variant"];
}

interface ThreadMessageInputProps {
  contextKey: string | undefined;
}

const ChatInput = React.forwardRef<
  HTMLInputElement,
  ChatInputProps & ThreadMessageInputProps
>(({ className, variant, contextKey, ...props }, ref) => {
  const { value, setValue, submit, isPending, error } =
    useTamboThreadInput(contextKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      await submit();
    } catch (error) {
      console.error("Failed to submit message:", error); // TODO: Add UI feedback
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(chatInputVariants({ variant }), className)}
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
      {error && (
        <p className="text-sm text-destructive mt-1">{error.message}</p>
      )}
    </form>
  );
});
ChatInput.displayName = "ChatInput";

export { ChatInput, chatInputVariants };
