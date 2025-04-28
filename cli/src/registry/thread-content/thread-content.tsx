"use client";

import type {
  messageVariants} from "@/components/ui/message";
import {
  Message,
  MessageBubble,
  MessageRenderedComponentArea
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
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
  messages: any[];
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
 * @returns {ThreadContentContextValue} The thread content context value.
 * @throws {Error} If used outside of ThreadContent.Root.
 * @internal
 */
const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent.Root",
    );
  }
  return context;
};

/**
 * Props for the ThreadContentRoot component.
 * Extends standard HTMLDivElement attributes.
 */
export interface ThreadContentRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** The child elements to render within the container. */
  children?: React.ReactNode;
}

/**
 * The root container for thread content.
 * It establishes the context for its children using data from the Tambo hook.
 * @component ThreadContent.Root
 * @example
 * ```tsx
 * <ThreadContent.Root variant="solid">
 *   <ThreadContent.Messages />
 * </ThreadContent.Root>
 * ```
 */
const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentRootProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { thread, generationStage } = useTambo();
    const messages = thread?.messages ?? [];
    const isGenerating = generationStage === "STREAMING_RESPONSE";

    const contextValue = React.useMemo(
      () => ({
        messages,
        isGenerating,
        generationStage,
        variant,
      }),
      [messages, isGenerating, generationStage, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(className)}
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
 * <ThreadContent.Root>
 *   <ThreadContent.Messages />
 * </ThreadContent.Root>
 * ```
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages } = useThreadContentContext();

  return (
    <div
      ref={ref}
      className={cn(className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {messages.map((message, index) => (
        <ThreadContentItem
          key={
            message.id ??
            `${message.role}-${message.createdAt ?? Date.now()}-${message.content?.toString().substring(0, 10)}`
          }
          message={message}
          index={index}
        />
      ))}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

/**
 * Props for the ThreadContentItem component.
 */
interface ThreadContentItemProps {
  /** The message object */
  message: any;
  /** Index of the message in the thread */
  index: number;
  /** Optional className */
  className?: string;
}

/**
 * Renders an individual message with animation effects.
 * @component ThreadContent.Item (internal)
 */
const ThreadContentItem = ({
  message,
  index,
  className,
}: ThreadContentItemProps) => {
  const { isGenerating, variant, messages } = useThreadContentContext();

  const showLoading = isGenerating && index === messages.length - 1;
  const messageContent = Array.isArray(message.content)
    ? (message.content[0]?.text ?? "Empty message")
    : typeof message.content === "string"
      ? message.content
      : "Empty message";

  return (
    <div
      className={cn(
        !isGenerating && "animate-in fade-in-0 slide-in-from-bottom-2",
        "duration-200 ease-out",
        className,
      )}
      style={!isGenerating ? { animationDelay: `${index * 40}ms` } : undefined}
      data-slot="thread-content-item"
    >
      <div
        className={cn(
          "flex flex-col gap-1.5",
          message.role === "user" ? "ml-auto mr-0" : "ml-0 mr-auto",
          "max-w-[85%]",
        )}
      >
        <Message
          role={message.role === "assistant" ? "assistant" : "user"}
          message={message}
          variant={variant}
          isLoading={showLoading}
        >
          <MessageBubble content={messageContent} />
          <MessageRenderedComponentArea />
        </Message>
      </div>
    </div>
  );
};

export { ThreadContent, ThreadContentMessages };
