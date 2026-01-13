"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  // MessageInputMcpConfigButton,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/tambo/message-suggestions";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import type { messageVariants } from "@/components/tambo/message";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { cn } from "@/lib/utils";
import {
  useMergeRefs,
  useCanvasDetection,
  usePositioning,
} from "@/lib/thread-hooks";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useRef } from "react";
import type { Suggestion } from "@tambo-ai/react";

/**
 * Props for the MessageThreadPanel component
 * @interface
 */
export interface MessageThreadPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
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
  /** Whether the panel should be positioned on the left (true) or right (false) */
  isLeftPanel: boolean;
}

/**
 * A resizable panel component with a draggable divider
 */
const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, isLeftPanel, ...props }, ref) => {
    const [width, setWidth] = React.useState(956);
    const isResizing = React.useRef(false);
    const lastUpdateRef = React.useRef(0);

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (!isResizing.current) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = now;

        const windowWidth = window.innerWidth;

        requestAnimationFrame(() => {
          let newWidth;
          if (isLeftPanel) {
            newWidth = Math.round(e.clientX);
          } else {
            newWidth = Math.round(windowWidth - e.clientX);
          }

          // Ensure minimum width of 300px
          const clampedWidth = Math.max(
            300,
            Math.min(windowWidth - 300, newWidth),
          );
          setWidth(clampedWidth);

          // Update both panel and canvas widths using the same divider position
          if (isLeftPanel) {
            document.documentElement.style.setProperty(
              "--panel-left-width",
              `${clampedWidth}px`,
            );
          } else {
            document.documentElement.style.setProperty(
              "--panel-right-width",
              `${clampedWidth}px`,
            );
          }
        });
      },
      [isLeftPanel],
    );

    return (
      <div
        ref={ref}
        className={cn(
          "h-screen flex flex-col bg-background relative",
          "transition-[width] duration-75 ease-out",
          "overflow-x-auto",
          isLeftPanel
            ? "border-r border-border"
            : "border-l border-border ml-auto",
          className,
        )}
        style={{
          width: `${width}px`,
          flex: "0 0 auto",
        }}
        {...props}
      >
        {/* Always show resize handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-ew-resize bg-border hover:bg-accent transition-colors z-50",
            isLeftPanel ? "right-0" : "left-0",
          )}
          onMouseDown={(e) => {
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
          }}
        />
        {children}
      </div>
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

/**
 * A resizable panel component that displays a chat thread with message history, input, and suggestions
 * @component
 * @example
 * ```tsx
 * // Default left positioning
 * <MessageThreadPanel />
 *
 * // Explicit right positioning
 * <MessageThreadPanel className="right" />
 * ```
 */
export const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, variant, ...props }, ref) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { hasCanvasSpace, canvasIsOnLeft } = useCanvasDetection(panelRef);
  const { isLeftPanel, historyPosition } = usePositioning(
    className,
    canvasIsOnLeft,
    hasCanvasSpace,
  );
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, panelRef);

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
    <ResizablePanel
      ref={mergedRef}
      isLeftPanel={isLeftPanel}
      className={className}
      {...props}
    >
      <div className="flex h-full relative">
        {historyPosition === "left" && (
          <div
            className="flex-none transition-all duration-300 ease-in-out"
            style={{ width: "var(--sidebar-width, 16rem)" }}
          >
            <ThreadHistory
              defaultCollapsed={true}
              position="left"
              className="h-full border-0 border-r border-flat"
            >
              <ThreadHistoryHeader />
              <ThreadHistoryNewButton />
              <ThreadHistorySearch />
              <ThreadHistoryList />
            </ThreadHistory>
          </div>
        )}

        <div className="flex flex-col h-full flex-grow transition-all duration-300 ease-in-out">
          {/* Message thread content */}
          <ScrollableMessageContainer className="p-4">
            <ThreadContent variant={variant}>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          {/* Message Suggestions Status */}
          <MessageSuggestions>
            <MessageSuggestionsStatus />
          </MessageSuggestions>

          {/* Message input */}
          <div className="p-4">
            <MessageInput>
              <MessageInputTextarea placeholder="Type your message or paste images..." />
              <MessageInputToolbar>
                <MessageInputFileButton />
                <MessageInputMcpPromptButton />
                <MessageInputMcpResourceButton />
                {/* Uncomment this to enable client-side MCP config modal button */}
                {/* <MessageInputMcpConfigButton /> */}
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

        {historyPosition === "right" && (
          <div
            className="flex-none transition-all duration-300 ease-in-out"
            style={{ width: "var(--sidebar-width, 16rem)" }}
          >
            <ThreadHistory
              defaultCollapsed={true}
              position="right"
              className="h-full border-0 border-l border-flat"
            >
              <ThreadHistoryHeader />
              <ThreadHistoryNewButton />
              <ThreadHistorySearch />
              <ThreadHistoryList />
            </ThreadHistory>
          </div>
        )}
      </div>
    </ResizablePanel>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";
