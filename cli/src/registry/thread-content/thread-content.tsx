"use client";

import { Message } from "@/components/ui/message";
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
 * Props for the ThreadContent component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface ThreadContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional styling variant for the thread content container */
  variant?: VariantProps<typeof threadContentVariants>["variant"];
}

/**
 * A component that displays a chat thread's messages with animations and loading states
 * @component
 * @example
 * ```tsx
 * <ThreadContent
 *   variant="solid"
 *   className="custom-styles"
 * />
 * ```
 */
export const ThreadContent = React.forwardRef<
  HTMLDivElement,
  ThreadContentProps
>(({ className, variant, ...props }, ref) => {
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
                role={
                  message.role === "hydra" || message.role === "assistant"
                    ? "assistant"
                    : "user"
                }
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
});
ThreadContent.displayName = "ThreadContent";
