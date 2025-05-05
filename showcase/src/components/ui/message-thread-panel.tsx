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
import type { messageVariants } from "@/components/ui/message";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import { cn } from "@/lib/utils";
import { useMergedRef } from "@/lib/thread-hooks";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import type { Suggestion } from "@tambo-ai/react";

/**
 * Props for the MessageThreadPanel component
 * @interface
 */
export interface MessageThreadPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional key to identify the context of the thread
   */
  contextKey?: string;
  /** Optional content to render in the left panel of the grid */
  children?: React.ReactNode;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/ui/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * Props for the ResizablePanel component
 */
interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children elements to render inside the container */
  children: React.ReactNode;
}

/**
 * A resizable panel component with a draggable divider
 * Always positioned on the right side for showcase purposes
 */
const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, ...props }, ref) => {
    const [width, setWidth] = React.useState(500);
    const isResizing = React.useRef(false);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const mergedRef = useMergedRef<HTMLDivElement | null>(ref, panelRef);

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      if (!isResizing.current) return;

      const containerRect =
        panelRef.current?.parentElement?.getBoundingClientRect();
      if (!containerRect || !panelRef.current) return;

      const newWidth = Math.round(containerRect.right - e.clientX);
      const clampedWidth = Math.max(
        300,
        Math.min(containerRect.width - 300, newWidth),
      );

      setWidth(clampedWidth);
      panelRef.current.style.width = `${clampedWidth}px`;
    }, []);

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener(
          "mouseup",
          () => {
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", handleMouseMove);
          },
          { once: true },
        );
      },
      [handleMouseMove],
    );

    return (
      <div
        ref={mergedRef}
        className={cn(
          "h-full flex flex-col bg-background relative overflow-hidden border-l border-border ml-auto",
          "transition-[width] duration-75 ease-out",
          className,
        )}
        style={{ width: `${width}px`, flex: "0 0 auto", maxWidth: "100%" }}
        {...props}
      >
        <div
          className="absolute inset-y-0 w-1 cursor-ew-resize hover:bg-gray-300 transition-colors z-50 left-0"
          onMouseDown={handleMouseDown}
        />
        {children}
      </div>
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

/**
 * A resizable panel component that displays a chat thread with message history
 * Purely for showcase purposes, always positioned on right side
 */
export const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, contextKey, variant, ...props }, ref) => {
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
    <ResizablePanel ref={ref} className={className} {...props}>
      <div className="flex h-full">
        <div className="flex flex-col h-full flex-1 min-w-0 w-[calc(100%-16rem)]">
          <ScrollableMessageContainer className="p-4">
            <ThreadContent variant={variant}>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          <MessageSuggestions>
            <MessageSuggestionsStatus />
          </MessageSuggestions>

          <div className="p-4">
            <MessageInput contextKey={contextKey}>
              <MessageInputTextarea />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
              <MessageInputError />
            </MessageInput>
          </div>

          <MessageSuggestions initialSuggestions={defaultSuggestions}>
            <MessageSuggestionsList />
          </MessageSuggestions>
        </div>

        <ThreadHistory
          contextKey={contextKey}
          defaultCollapsed={true}
          position="right"
          className="h-full border-0 border-l border-flat rounded-r-lg relative z-10"
        >
          <ThreadHistoryHeader />
          <ThreadHistoryNewButton />
          <ThreadHistorySearch />
          <ThreadHistoryList />
        </ThreadHistory>
      </div>
    </ResizablePanel>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";
