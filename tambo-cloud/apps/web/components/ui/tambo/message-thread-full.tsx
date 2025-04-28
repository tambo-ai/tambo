"use client";

import { MessageInput } from "@/components/ui/tambo/message-input";
import { ThreadContent } from "@/components/ui/tambo/thread-content";
import { ThreadHistory } from "@/components/ui/tambo/thread-history";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Represents a full message thread component
 * @property {string} className - Optional className for custom styling
 */

export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
}

const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, contextKey, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();

  useEffect(() => {
    if (scrollContainerRef.current && thread.messages.length) {
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
  }, [thread.messages]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col bg-white rounded-lg shadow-sm overflow-hidden bg-background border border-gray-200",
        "h-full",
        "w-full",
        className,
      )}
      {...props}
    >
      <div className="p-2 sm:p-3 border-b border-gray-200 flex items-center justify-end">
        <ThreadHistory
          contextKey={contextKey}
          position={{ side: "left", align: "start" }}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-3 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        <ThreadContent className="py-2 sm:py-3" />
      </div>
      {/* <MessageSuggestions /> */}
      <div className="p-2 sm:p-3 border-t border-gray-200">
        <MessageInput contextKey={contextKey} />
      </div>
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";

export { MessageThreadFull };
