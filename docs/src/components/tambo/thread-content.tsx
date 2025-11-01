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
export interface ThreadContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
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
 *   <ThreadContentMessages />
 * </ThreadContent>
 * ```
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
 * Extends standard HTMLDivElement attributes, excluding children.
 */
export interface ThreadContentMessagesProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Optional render function for custom message rendering.
   * If provided, you have full control over how each message is displayed.
   * If not provided, uses default rendering.
   *
   * @example
   * ```tsx
   * <ThreadContentMessages>
   *   {(message) => (
   *     <div className="my-custom-message">
   *       {message.content}
   *     </div>
   *   )}
   * </ThreadContentMessages>
   * ```
   */
  children?: (message: TamboThreadMessage) => React.ReactNode;
}

/**
 * Renders the list of messages in the thread.
 * Automatically connects to the context to display messages.
 * @component ThreadContentMessages
 * @example
 * ```tsx
 * <ThreadContent>
 *   <ThreadContentMessages />
 * </ThreadContent>
 * ```
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, children, ...props }, ref) => {
  const { messages, isGenerating, variant } = useThreadContentContext();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system" && !message.parentMessageId,
  );

  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-12", className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {filteredMessages.map((message, index) => {
        const key =
          message.id ??
          `${message.role}-${
            message.createdAt ?? Date.now()
          }-${message.content?.toString().substring(0, 10)}`;

        // If children render prop provided, use it for custom rendering
        if (children) {
          return (
            <div key={key} data-slot="thread-content-item">
              {children(message)}
            </div>
          );
        }

        // Otherwise, use default rendering
        return (
          <div key={key} data-slot="thread-content-item">
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
          </div>
        );
      })}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContentMessages";

export { ThreadContent, ThreadContentMessages };
