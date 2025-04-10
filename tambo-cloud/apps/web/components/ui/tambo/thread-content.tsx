"use client";

import { Message } from "@/components/ui/tambo/message";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const threadContentVariants = cva("flex flex-col gap-4", {
  variants: {
    variant: {
      default: "",
      solid: [
        "shadow shadow-zinc-900/10 dark:shadow-zinc-900/20",
        "bg-muted dark:bg-muted",
      ].join(" "),
      bordered: ["border-2", "border-border"].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Represents a thread content component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof threadContentVariants>["variant"]} variant - Optional variant for custom styling
 */

export interface ThreadContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof threadContentVariants>["variant"];
}

// Helper function to determine if a role should be treated as assistant
function isAssistantRole(role: string): boolean {
  return role === "assistant" || role === "hydra" || role === "tambo";
}

const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ className, variant, ...props }, ref) => {
    const { thread, generationStage } = useTambo();
    const messages = thread?.messages ?? [];
    const isGenerating = generationStage === "STREAMING_RESPONSE";

    return (
      <div
        ref={ref}
        className={cn(threadContentVariants({ variant }), className)}
        {...props}
      >
        {messages.map((message, index) => {
          const showLoading = isGenerating && index === messages.length - 1;
          const messageContent = Array.isArray(message.content)
            ? (message.content[0]?.text ?? "Empty message")
            : typeof message.content === "string"
              ? message.content
              : "Empty message";

          // Determine the role for display
          const displayRole = isAssistantRole(message.role)
            ? "assistant"
            : "user";

          return (
            <div
              key={
                message.id ??
                `${message.role}-${message.createdAt ?? Date.now()}-${message.content?.toString().substring(0, 10)}`
              }
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-2",
                "duration-200 ease-in-out",
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div
                className={cn(
                  "flex flex-col gap-1.5",
                  message.role === "user" ? "ml-auto mr-0" : "ml-0 mr-auto",
                  "max-w-[85%]",
                )}
              >
                <Message
                  role={displayRole}
                  content={messageContent}
                  variant={variant}
                  message={message}
                  isLoading={showLoading}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

export { ThreadContent, threadContentVariants };
