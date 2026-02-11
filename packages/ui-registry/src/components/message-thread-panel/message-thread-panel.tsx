"use client";

import type { Suggestion } from "@tambo-ai/react";
import type { messageVariants } from "@tambo-ai/ui-registry/components/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@tambo-ai/ui-registry/components/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@tambo-ai/ui-registry/components/message-suggestions";
import { ScrollableMessageContainer } from "@tambo-ai/ui-registry/components/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@tambo-ai/ui-registry/components/thread-history";
import {
  useCanvasDetection,
  useMergeRefs,
  usePositioning,
} from "@tambo-ai/ui-registry/lib/thread-hooks";
import { cn } from "@tambo-ai/ui-registry/utils";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useRef } from "react";

/**
 * Props for the MessageThreadPanel component
 * @interface
 */
export interface MessageThreadPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@tambo-ai/ui-registry/components/message".
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

const DEFAULT_SIDEBAR_WIDTH = 600; // Default width for the history sidebar
const MIN_SIDEBAR_WIDTH = 300; // Minimum width for the history sidebar
/**
 * A resizable panel component with a draggable divider
 */
const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, isLeftPanel, ...props }, ref) => {
    const [width, setWidth] = React.useState(1024);
    const isResizing = React.useRef(false);
    const lastUpdateRef = React.useRef(0);

    React.useEffect(() => {
      const windowWidth =
        window.document.documentElement.getBoundingClientRect().width || 1024;
      const initialWidth = Math.min(DEFAULT_SIDEBAR_WIDTH, windowWidth / 2);
      setWidth(initialWidth);
    }, []);

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

          const clampedWidth = Math.max(
            MIN_SIDEBAR_WIDTH,
            Math.min(windowWidth - MIN_SIDEBAR_WIDTH, newWidth),
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
        data-slot="resizeable-panel"
        ref={ref}
        className={cn(
          "h-screen max-h-full w-full flex flex-col bg-background relative",
          "transition-[width] duration-75 ease-out",
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
