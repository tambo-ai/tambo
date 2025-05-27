"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "@/components/ui/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
} from "@/components/ui/tambo/message-suggestions";
import type { messageVariants } from "@/components/ui/tambo/message";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/tambo/thread-content";
import {
  ThreadContainer,
  useThreadContainerContext,
} from "@/components/ui/tambo/thread-container";
import { ScrollableMessageContainer } from "@/components/ui/tambo/scrollable-message-container";
import { useMergedRef } from "@/lib/thread-hooks";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for the thread */
  contextKey?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/ui/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, contextKey, variant, ...props }, ref) => {
  const { containerRef } = useThreadContainerContext();
  const mergedRef = useMergedRef<HTMLDivElement | null>(ref, containerRef);

  return (
    <>
      <ThreadContainer ref={mergedRef} className={className} {...props}>
        <ScrollableMessageContainer className="p-4">
          <ThreadContent variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>

        {/* Message suggestions status */}
        <MessageSuggestions>
          <MessageSuggestionsStatus />
        </MessageSuggestions>

        {/* Message input */}
        <div className="p-4">
          <MessageInput contextKey={contextKey}>
            <MessageInputTextarea />
            <MessageInputToolbar>
              <MessageInputSubmitButton />
            </MessageInputToolbar>
            <MessageInputError />
          </MessageInput>
        </div>
      </ThreadContainer>
    </>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
