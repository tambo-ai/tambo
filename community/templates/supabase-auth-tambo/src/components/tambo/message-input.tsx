"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import * as React from "react";

export interface MessageInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSubmit"
> {
  onSubmit?: (value: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput = React.forwardRef<HTMLDivElement, MessageInputProps>(
  ({ className, onSubmit, placeholder, disabled, ...props }, ref) => {
    const { value, setValue, submit, isPending } = useTamboThreadInput();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleSubmit = async () => {
      if (!value.trim() || isPending || disabled) return;

      try {
        setError(null);
        await submit({ streamResponse: true });
        if (onSubmit) {
          await onSubmit(value);
        }
        setValue("");
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send message";
        setError(message);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("border-t border-border bg-background p-4", className)}
        {...props}
      >
        {error && (
          <div className="mb-3 p-2 text-xs text-destructive bg-destructive/10 rounded">
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-3"
        >
          <textarea
            ref={textareaRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type your message..."}
            rows={1}
            disabled={isPending || disabled}
            className="flex-1 resize-none rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={!value.trim() || isPending || disabled}
            className="px-4 py-3 border border-input hover:bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";
