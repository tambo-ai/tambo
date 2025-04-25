"use client";

import {
  MessageInputRoot,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "@/components/ui/message-input";
import {
  MessageSuggestionsRoot,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/ui/message-suggestions";
import {
  ThreadContentRoot,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import {
  ThreadHistoryRoot,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/ui/thread-history";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useEffect, useRef } from "react";
import type { messageVariants } from "@/components/ui/message";

/**
 * Props for the MessageThreadPanel component
 * @interface
 */
export interface MessageThreadPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional key to identify the context of the thread
   * Used to maintain separate thread histories for different contexts
   */
  contextKey?: string;
  /** Optional content to render in the left panel of the grid */
  children?: React.ReactNode;
  /** Whether to enable the canvas space */
  enableCanvasSpace?: boolean;
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** position of the panel */
  position?: "left" | "right";
}

/**
 * Props for the ResizablePanel component
 */
interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to enable canvas space integration */
  enableCanvasSpace?: boolean;
  /** Position of the panel */
  position?: "left" | "right";
  /** Children elements to render inside the container */
  children: React.ReactNode;
}

/**
 * A resizable panel component with a draggable divider
 */
const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  (
    {
      enableCanvasSpace = false,
      position = "right",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [width, setWidth] = React.useState(500);
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
          if (position === "left") {
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
          if (position === "left") {
            document.documentElement.style.setProperty(
              "--panel-left-width",
              `${clampedWidth}px`,
            );
            document.documentElement.style.setProperty(
              "--canvas-width",
              `${windowWidth - clampedWidth}px`,
            );
          } else {
            document.documentElement.style.setProperty(
              "--panel-right-width",
              `${clampedWidth}px`,
            );
            document.documentElement.style.setProperty(
              "--canvas-width",
              `${windowWidth - clampedWidth}px`,
            );
          }
        });
      },
      [position],
    );

    return (
      <div
        ref={ref}
        className={cn(
          "h-full fixed top-0 bg-background flex flex-col",
          "transition-[width] duration-75 ease-out",
          position === "left"
            ? "left-0 border-r border-gray-200"
            : "right-0 border-l border-gray-200",
          className,
        )}
        style={{ width: `${width}px` }}
        {...props}
      >
        {/* Only show divider if canvas is enabled */}
        {enableCanvasSpace && (
          <div
            className={cn(
              "absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-gray-300 transition-colors z-50",
              position === "left" ? "right-0" : "left-0",
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
        )}
        {children}
      </div>
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

/**
 * A scrollable container for message content with auto-scroll functionality
 */
const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();

  // Handle forwarded ref
  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current && thread?.messages?.length) {
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [thread?.messages]);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex-1 overflow-y-auto p-4",
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-gray-300",
        "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";

/**
 * A resizable panel component that displays a chat thread with message history, input, and suggestions
 * @component
 * @example
 * ```tsx
 * <MessageThreadPanel
 *   contextKey="my-thread"
 *   className="custom-styles"
 *   enableCanvasSpace={true}
 *   position="left"
 *   variant="default"
 * />
 * ```
 */
export const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(
  (
    {
      className,
      contextKey,
      enableCanvasSpace = false,
      variant,
      position = "right",
      ...props
    },
    ref,
  ) => {
    return (
      <ResizablePanel
        ref={ref}
        enableCanvasSpace={enableCanvasSpace}
        position={position}
        className={className}
        {...props}
      >
        <div className="flex h-full relative">
          {position === "left" && (
            <ThreadHistoryRoot
              contextKey={contextKey}
              defaultCollapsed={false}
              position="left"
              className="relative h-full border-0 border-r border-flat"
            >
              <ThreadHistoryHeader />
              <ThreadHistoryNewButton />
              <ThreadHistorySearch />
              <ThreadHistoryList />
            </ThreadHistoryRoot>
          )}

          <div className="flex flex-col h-full flex-grow">
            <ScrollableMessageContainer>
              <ThreadContentRoot
                enableCanvasSpace={enableCanvasSpace}
                variant={variant}
              >
                <ThreadContentMessages />
              </ThreadContentRoot>
            </ScrollableMessageContainer>
            <div className="p-4">
              <MessageInputRoot contextKey={contextKey}>
                <MessageInputTextarea />
                <MessageInputToolbar>
                  <MessageInputSubmitButton />
                </MessageInputToolbar>
              </MessageInputRoot>
              <MessageInputError />
            </div>
            <MessageSuggestionsRoot>
              <MessageSuggestionsStatus />
              <MessageSuggestionsList />
            </MessageSuggestionsRoot>
          </div>

          {position === "right" && (
            <ThreadHistoryRoot
              contextKey={contextKey}
              defaultCollapsed={false}
              position="right"
              className="relative h-full border-0 border-l border-flat"
            >
              <ThreadHistoryHeader />
              <ThreadHistoryNewButton />
              <ThreadHistorySearch />
              <ThreadHistoryList />
            </ThreadHistoryRoot>
          )}
        </div>
      </ResizablePanel>
    );
  },
);
MessageThreadPanel.displayName = "MessageThreadPanel";
