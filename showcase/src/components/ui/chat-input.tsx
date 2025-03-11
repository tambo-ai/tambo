import * as React from "react";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chatInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "shadow shadow-zinc-900/10 dark:shadow-zinc-900/20",
        "[&_input]:bg-zinc-50 [&_input]:dark:bg-zinc-900",
      ].join(" "),
      bordered: [
        "[&_input]:border-2",
        "[&_input]:border-zinc-200/40 [&_input]:dark:border-zinc-700/40",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ChatInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  onValueSubmit: (value: string) => void;
  isLoading?: boolean;
  variant?: VariantProps<typeof chatInputVariants>["variant"];
}

const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
  ({ className, onValueSubmit, isLoading, variant, ...props }, ref) => {
    const [input, setInput] = React.useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      onValueSubmit(input);
      setInput("");
    };

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(chatInputVariants({ variant }), className)}
      >
        <div className="flex gap-2">
          <input
            ref={ref}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            disabled={isLoading}
            {...props}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </form>
    );
  },
);
ChatInput.displayName = "ChatInput";

export { ChatInput, chatInputVariants };
