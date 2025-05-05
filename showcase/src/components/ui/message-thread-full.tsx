"use client";

import type { messageVariants } from "@/components/ui/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/ui/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/ui/message-suggestions";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import {
  ThreadContainer,
  useThreadContainerContext,
} from "@/components/ui/thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/ui/thread-history";
import { useMergedRef } from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
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
  const { containerRef, historyPosition } = useThreadContainerContext();
  const mergedRef = useMergedRef<HTMLDivElement | null>(ref, containerRef);

  // Track sidebar width changes using state
  const [sidebarWidth, setSidebarWidth] = React.useState("16rem"); // Default expanded width

  // Effect to listen for CSS variable changes and update state
  React.useEffect(() => {
    let observer: MutationObserver | null = null;

    const updateSidebarWidth = () => {
      // Ensure we're running in the browser
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const width =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sidebar-width")
            .trim() || "16rem"; // Fallback to default
        setSidebarWidth(width);
      }
    };

    // Initial read of the variable
    updateSidebarWidth();

    // Observe changes to the style attribute of the root element
    if (typeof document !== "undefined") {
      observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
          ) {
            // Re-check the variable value when style attribute changes
            updateSidebarWidth();
            break; // No need to check other mutations if style changed
          }
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    // Cleanup observer on component unmount
    return () => {
      observer?.disconnect();
    };
  }, []); // Empty dependency array, runs once on mount

  const threadHistorySidebar = (
    <ThreadHistory
      contextKey={contextKey}
      position={historyPosition}
      defaultCollapsed={false}
      className="absolute h-full z-10 border-flat rounded-l-lg bg-container transition-all duration-300"
    >
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

      <ThreadContainer
        ref={mergedRef}
        // Pass through original className, but override width/margins with style
        className={className}
        style={{
          // Explicitly set width based on observed sidebarWidth
          width: `calc(100% - ${sidebarWidth})`,
          // Explicitly set margins based on observed sidebarWidth and position
          marginLeft: historyPosition === "left" ? sidebarWidth : "0",
          marginRight: historyPosition === "right" ? sidebarWidth : "0",
          // Add transition for smoothness
          transition: "width 0.3s ease-in-out, margin 0.3s ease-in-out",
          // Ensure other styles from className potentially affecting layout are compatible
          ...(props.style || {}), // Merge with any incoming style props
        }}
        // Pass other props, but style is handled above
        {...{ ...props }}
      >
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
      </ThreadContainer>

      {/* Thread History Sidebar - rendered last if history is on the right */}
      {historyPosition === "right" && threadHistorySidebar}
    </>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
