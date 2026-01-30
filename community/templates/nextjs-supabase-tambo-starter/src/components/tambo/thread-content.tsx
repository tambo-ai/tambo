"use client";

import {
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  ReasoningInfo,
  ToolcallInfo,
  type messageVariants,
} from "@/components/tambo/message";
import { cn } from "@/lib/utils";
import { type TamboThreadMessage, useTambo } from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * @typedef ThreadContentContextValue
 * @property {Array} messages - Array of message objects in the thread
 * @property {boolean} isGenerating - Whether a response is being generated
 * @property {string|undefined} generationStage - Current generation stage
 * @property {VariantProps<typeof messageVariants>["variant"]} [variant] - Optional styling variant for messages
 */
interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  isGenerating: boolean;
  generationStage?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * React Context for sharing thread data among sub-components.
 * @internal
 */
const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

/**
 * Hook to access the thread content context.
 * @internal
 */
const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent",
    );
  }
  return context;
};

/**
 * Props for the ThreadContent component.
 */
export interface ThreadContentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageVariants>["variant"];
  children?: React.ReactNode;
}

/**
 * Root container for thread content
 */
const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { thread, generationStage, isIdle } = useTambo();
    const isGenerating = !isIdle;

    const contextValue = React.useMemo(
      () => ({
        messages: thread?.messages ?? [],
        isGenerating,
        generationStage,
        variant,
      }),
      [thread?.messages, isGenerating, generationStage, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "w-full min-h-0",
            className,
          )}
          data-slot="thread-content-container"
          {...props}
        >
          {children}
        </div>
      </ThreadContentContext.Provider>
    );
  },
);

ThreadContent.displayName = "ThreadContent";

/**
 * Props for the ThreadContentMessages component.
 */
export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders the list of messages in the thread.
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages, isGenerating, variant } =
    useThreadContentContext();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system" && !message.parentMessageId,
  );

  return (
    <div
      ref={ref}
      className={cn(
        "flex-1 min-h-0",
        "flex flex-col gap-3 p-2",
        className,
      )}
      data-slot="thread-content-messages"
      {...props}
    >
      {filteredMessages.map((message, index) => (
        <div
          key={
            message.id ??
            `${message.role}-${message.createdAt ?? index}`
          }
          data-slot="thread-content-item"
        >
          <Message
            role={message.role === "assistant" ? "assistant" : "user"}
            message={message}
            variant={variant}
            isLoading={
              isGenerating &&
              index === filteredMessages.length - 1
            }
            className={cn(
              "flex w-full",
              message.role === "assistant"
                ? "justify-start"
                : "justify-end",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-1",
                message.role === "assistant"
                  ? "w-full"
                  : "max-w-3xl",
              )}
            >
              <ReasoningInfo />
              <MessageImages />

              <MessageContent
                className={cn(
                  "rounded-xl border text-sm",
                  message.role === "assistant"
                    ? "bg-card border-border text-foreground"
                    : "bg-muted border-border text-foreground",
                )}
              />

              <ToolcallInfo />
              <MessageRenderedComponentArea className="w-full" />
            </div>
          </Message>
        </div>
      ))}
    </div>
  );
});

ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };
