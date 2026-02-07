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
  getMessageKey,
  ThreadContent as ThreadContentBase,
  type ThreadContentMessageListRenderProps,
  type ThreadContentRootProps as ThreadContentBaseRootProps,
} from "@tambo-ai/react-ui-base/thread-content";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Props for the ThreadContent component.
 * Extends standard HTMLDivElement attributes.
 */
export interface ThreadContentProps extends Omit<
  ThreadContentBaseRootProps,
  "asChild"
> {
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
 * @returns The thread content root element
 */
const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <ThreadContentVariantContext.Provider value={variant}>
        <ThreadContentBase.Root
          ref={ref}
          className={cn("w-full", className)}
          {...props}
        >
          {children}
        </ThreadContentBase.Root>
      </ThreadContentVariantContext.Provider>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

/**
 * Internal context to pass variant down to message list without
 * coupling it to the base component's context.
 */
const ThreadContentVariantContext = React.createContext<
  VariantProps<typeof messageVariants>["variant"] | undefined
>(undefined);

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
 * @returns The message list element
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const variant = React.useContext(ThreadContentVariantContext);

  return (
    <ThreadContentBase.MessageList
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      render={({
        messages: filteredMessages,
        isGenerating,
      }: ThreadContentMessageListRenderProps) =>
        filteredMessages.map((message, index) => (
          <ThreadContentBase.Message
            key={getMessageKey(message, index)}
            message={message}
            index={index}
            total={filteredMessages.length}
            isGenerating={isGenerating}
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
                <MessageContent
                  className={
                    message.role === "assistant"
                      ? "text-foreground font-sans"
                      : "text-foreground bg-container hover:bg-backdrop font-sans"
                  }
                />
                <ToolcallInfo />
                <MessageRenderedComponentArea className="w-full" />
              </div>
            </Message>
          </ThreadContentBase.Message>
        ))
      }
      {...props}
    />
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };
