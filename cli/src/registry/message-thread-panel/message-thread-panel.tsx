"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ThreadContent } from "@/components/ui/thread-content";
import { MessageInput } from "@/components/ui/message-input";

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
>(({ className, contextKey, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "h-full fixed right-0 top-0 w-[500px] border-l border-gray-200 bg-background shadow-lg",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Chat with tambo</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadContent
            ref={(el: HTMLDivElement) => {
              if (el) {
                const isNearBottom =
                  el.scrollHeight - el.clientHeight - el.scrollTop < 100;
                if (isNearBottom) {
                  el.scrollTop = el.scrollHeight;
                }
              }
            }}
          />
        </div>
        <div className="p-4 border-t border-gray-200">
          <MessageInput contextKey={contextKey} />
        </div>
      </div>
    </div>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";

export { MessageThreadPanel };
