"use client";

import { MessageInput } from "@/components/ui/message-input";
import { MessageSuggestions } from "@/components/ui/message-suggestions";
import { ThreadContent } from "@/components/ui/thread-content";
import { ThreadHistory } from "@/components/ui/thread-history";
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
    const [width, setWidth] = React.useState(500);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { thread } = useTambo();
    const isResizing = React.useRef(false);
    const lastUpdateRef = React.useRef(0);

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
          "h-full fixed top-0 bg-background",
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
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Use AI</h2>
            <ThreadHistory contextKey={contextKey} />
          </div>
          <div
            className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar:horizontal]:h-[4px]"
            ref={scrollContainerRef}
          >
            <ThreadContent
              enableCanvasSpace={enableCanvasSpace}
              variant={variant}
            />
          </div>
          <div className="p-4">
            <MessageInput contextKey={contextKey} />
          </div>
          <MessageSuggestions />
        </div>
      </div>
    );
  },
);
MessageThreadPanel.displayName = "MessageThreadPanel";
