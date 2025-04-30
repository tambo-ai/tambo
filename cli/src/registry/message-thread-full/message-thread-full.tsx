"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "@/components/ui/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/ui/message-suggestions";
import type { messageVariants } from "@/components/ui/message";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/ui/thread-history";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { cn } from "@/lib/utils";
import {
  useMergedRef,
  useCanvasDetection,
  usePositioning,
} from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useRef } from "react";

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
  const threadRef = useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(threadRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    className,
    canvasIsOnLeft,
    hasCanvasSpace,
  );
  const mergedRef = useMergedRef<HTMLDivElement | null>(ref, threadRef);

  const threadHistorySidebar = (
    <ThreadHistory contextKey={contextKey} position={historyPosition}>
      <ThreadHistoryHeader />
      <ThreadHistoryNewButton />
      <ThreadHistorySearch />
      <ThreadHistoryList />
    </ThreadHistory>
  );

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Learn more",
      detailedSuggestion: "Tell me about your capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Show me some example queries I can try.",
      messageId: "examples-query",
    },
  ];

  return (
    <>
      {/* Thread History Sidebar - rendered first if history is on the left */}
      {historyPosition === "left" && threadHistorySidebar}

      <div
        ref={mergedRef}
        className={cn(
          // Base layout and styling
          "flex flex-col bg-white overflow-hidden bg-background", // Flex column layout with white background
          "h-screen", // Full viewport height

          // Sidebar spacing based on history position
          historyPosition === "right"
            ? "mr-[var(--sidebar-width,16rem)]" // Margin right when history is on right
            : "ml-[var(--sidebar-width,16rem)]", // Margin left when history is on left

          // Width constraints based on canvas presence
          hasCanvasSpace
            ? "max-w-3xl"
            : "w-[calc(100%-var(--sidebar-width,16rem))]", // Max width with canvas, full width minus sidebar without

          // Border styling when canvas is present
          hasCanvasSpace && (canvasIsOnLeft ? "border-l" : "border-r"), // Left/right border based on canvas position
          hasCanvasSpace && "border-border", // Border color

          // Right alignment when specified
          !isLeftPanel && "ml-auto", // Auto margin left to push to right when right class is specified

          // Custom classes passed via props
          className,
        )}
        {...props}
      >
        {/* Message thread content */}
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

        {/* Message suggestions */}
        <MessageSuggestions initialSuggestions={defaultSuggestions}>
          <MessageSuggestionsList />
        </MessageSuggestions>
      </div>

      {/* Thread History Sidebar - rendered last if history is on the right */}
      {historyPosition === "right" && threadHistorySidebar}
    </>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
