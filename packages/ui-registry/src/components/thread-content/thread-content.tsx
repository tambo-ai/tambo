"use client";

import { type Content, type TamboThreadMessage } from "@tambo-ai/react";
import {
  ThreadContent as ThreadContentPrimitive,
  type ThreadContentMessagesState,
} from "@tambo-ai/react-ui-base/thread-content";
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
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

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
 * Styled wrapper over the ThreadContent base primitive.
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
    return (
      <ThreadContentPrimitive.Root
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        {children == null ? (
          <ThreadContentMessagesStyled variant={variant} />
        ) : (
          <VariantContext.Provider value={variant}>
            {children}
          </VariantContext.Provider>
        )}
      </ThreadContentPrimitive.Root>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

const VariantContext = React.createContext<
  VariantProps<typeof messageVariants>["variant"] | undefined
>(undefined);

/**
 * Props for the ThreadContentMessages component.
 * Extends standard HTMLDivElement attributes.
 */
export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders the list of messages in the thread.
 * Styled wrapper that uses the base primitive's render prop for message rendering.
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const variant = React.useContext(VariantContext);

  return (
    <ThreadContentMessagesStyled
      ref={ref}
      className={className}
      variant={variant}
      {...props}
    />
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

interface ThreadContentMessagesStyledProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * Internal component rendering the styled message list via the base primitive's render prop.
 */
const ThreadContentMessagesStyled = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesStyledProps
>(({ className, variant, ...props }, ref) => {
  return (
    <ThreadContentPrimitive.Messages
      ref={ref}
      {...props}
      render={(renderProps, state) => (
        <div
          {...renderProps}
          className={cn(
            renderProps.className,
            "flex flex-col gap-2",
            className,
          )}
        >
          <MessageList
            filteredMessages={state.filteredMessages}
            isGenerating={state.isGenerating}
            variant={variant}
          />
        </div>
      )}
    />
  );
});
ThreadContentMessagesStyled.displayName = "ThreadContentMessagesStyled";

interface MessageListProps {
  filteredMessages: ThreadContentMessagesState["filteredMessages"];
  isGenerating: boolean;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

function MessageList({
  filteredMessages,
  isGenerating,
  variant,
}: MessageListProps) {
  return (
    <>
      {filteredMessages.map((message, index) => (
        <ThreadMessage
          key={
            message.id ??
            `${message.role}-${message.createdAt ?? `${index}`}-${message.content?.toString().substring(0, 10)}`
          }
          message={message}
          isLast={index === filteredMessages.length - 1}
          isGenerating={isGenerating}
          variant={variant}
        />
      ))}
    </>
  );
}

interface ThreadMessageProps {
  message: TamboThreadMessage;
  isLast: boolean;
  isGenerating: boolean;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

function ThreadMessage({
  message,
  isLast,
  isGenerating,
  variant,
}: ThreadMessageProps) {
  const messageContentClassName =
    message.role === "assistant"
      ? "text-foreground font-sans"
      : "text-foreground bg-container font-sans";

  return (
    <div data-slot="thread-content-item">
      <Message
        role={message.role === "assistant" ? "assistant" : "user"}
        message={message}
        variant={variant}
        isLoading={isGenerating && isLast}
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
                    messageContent={[block]}
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
}

export { ThreadContent, ThreadContentMessages };
