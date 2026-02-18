"use client";

import {
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  ReasoningInfo,
  ToolcallInfo,
  type messageVariants,
} from "@tambo-ai/ui-registry/components/message";
import { cn } from "@tambo-ai/ui-registry/utils";
import {
  type Content,
  type TamboThreadMessage,
  useTambo,
} from "@tambo-ai/react";
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
 * @returns {ThreadContentContextValue} The thread content context value.
 * @throws {Error} If used outside of ThreadContent.
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
 * Extends standard HTMLDivElement attributes.
 */
export interface ThreadContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** The child elements to render within the container. */
  children?: React.ReactNode;
}

/**
 * The root container for thread content.
 * It establishes the context for its children using data from the Tambo hook.
 * @component ThreadContent
 * @example
 * ```tsx
 * <ThreadContent variant="solid">
 *   <ThreadContent.Messages />
 * </ThreadContent>
 * ```
 */
const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { messages, isIdle } = useTambo();
    const isGenerating = !isIdle;

    const contextValue = React.useMemo(
      () => ({
        messages,
        isGenerating,
        variant,
      }),
      [messages, isGenerating, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("w-full", className)}
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
 * Extends standard HTMLDivElement attributes.
 */
export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders the list of messages in the thread.
 * Automatically connects to the context to display messages.
 * @component ThreadContent.Messages
 * @example
 * ```tsx
 * <ThreadContent>
 *   <ThreadContent.Messages />
 * </ThreadContent>
 * ```
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages, isGenerating, variant } = useThreadContentContext();

  const filteredMessages = messages.filter((message) => {
    if (message.role === "system") return false;
    // Hide messages that only contain tool_result content blocks.
    // These are consumed by ToolcallInfo on the preceding tool_use message
    // and shouldn't render as standalone message bubbles.
    if (
      message.content.length > 0 &&
      message.content.every((block) => block.type === "tool_result")
    ) {
      return false;
    }
    return true;
  });

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {filteredMessages.map((message, index) => {
        const messageContentClassName =
          message.role === "assistant"
            ? "text-foreground font-sans"
            : "text-foreground bg-container hover:bg-backdrop font-sans";

        return (
          <div
            key={
              message.id ??
              `${message.role}-${message.createdAt ?? `${index}`}-${message.content?.toString().substring(0, 10)}`
            }
            data-slot="thread-content-item"
          >
            <Message
              role={message.role === "assistant" ? "assistant" : "user"}
              message={message}
              variant={variant}
              isLoading={isGenerating && index === filteredMessages.length - 1}
              className={cn(
                "flex w-full",
                message.role === "assistant" ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  message.role === "assistant" ? "w-full" : "max-w-3xl",
                )}
              >
                <ReasoningInfo />
                <MessageImages />
                {message.content.map((block, blockIndex) => {
                  switch (block.type) {
                    case "text":
                    case "resource":
                      return (
                        <MessageContent
                          key={`content-${blockIndex}`}
                          content={[block]}
                          className={messageContentClassName}
                        />
                      );
                    case "tool_use":
                      return (
                        <ToolcallInfo
                          key={`tool-${block.id ?? blockIndex}`}
                          toolUse={block}
                        />
                      );
                    case "tool_result":
                    case "component":
                      // tool_result is rendered by ToolcallInfo on the preceding assistant message.
                      // component is rendered by MessageRenderedComponentArea below.
                      return null;
                    default: {
                      const _exhaustive: never = block;
                      console.error(
                        "Unknown content block type:",
                        (_exhaustive as Content).type,
                      );
                      return null;
                    }
                  }
                })}
                <MessageRenderedComponentArea className="w-full" />
              </div>
            </Message>
          </div>
        );
      })}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };
