"use client";

import { MessageInput } from "@/components/ui/message-input";
import { MessageSuggestions } from "@/components/ui/message-suggestions";
import { ThreadContent } from "@/components/ui/thread-content";
import { ThreadHistory } from "@/components/ui/thread-history";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Represents a message thread panel component
 * @property {string} className - Optional className for custom styling
 * @property {string} contextKey - Optional context key for the Tambo thread
 * @property {React.ReactNode} children - Optional content to render in the left panel of the grid
 */

export interface MessageThreadPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  children?: React.ReactNode;
}

const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, contextKey, ...props }, _ref) => {
  const [width, setWidth] = React.useState(400);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();
  const isResizing = React.useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerRect =
      containerRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const parentWidth = containerRect.width;
    const newWidth = parentWidth - (e.clientX - containerRect.left);
    setWidth(Math.max(300, Math.min(800, newWidth)));
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  }, [handleMouseMove]);

  const startResizing = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
    },
    [handleMouseMove, stopResizing],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full border-l border-gray-200 bg-background shadow-lg dark:border-gray-800",
        className,
      )}
      style={{ width: `${width}px` }}
      {...props}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-gray-300 transition-colors"
        onMouseDown={startResizing}
      />
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Use AI</h2>
          <ThreadHistory contextKey={contextKey} />
        </div>
        <div
          className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700"
          ref={scrollContainerRef}
        >
          <ThreadContent />
        </div>
        <MessageSuggestions />
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <MessageInput contextKey={contextKey} />
        </div>
      </div>
    </div>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";

export { MessageThreadPanel };
