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
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/ui/thread-history";
import type { messageVariants } from "@/components/ui/message";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { cn } from "@/lib/utils";
import {
  useMergedRef,
  useCanvasDetection,
  usePositioning,
} from "@/lib/thread-hooks";
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
          <ThreadContent className="py-4" variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>

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
        <MessageSuggestions>
          <MessageSuggestionsStatus />
          <MessageSuggestionsList />
        </MessageSuggestions>
      </div>

      {/* Thread History Sidebar - rendered last if history is on the right */}
      {historyPosition === "right" && threadHistorySidebar}
    </>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
