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
      ref={ref}
      className={cn(
        "flex flex-col bg-white rounded-lg shadow-sm overflow-hidden bg-background border border-gray-200",
        "h-[90vh] sm:h-[85vh] md:h-[80vh]",
        "w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto",
        className,
      )}
      {...props}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Use AI</h2>
        <ThreadHistory contextKey={contextKey} />
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        <ThreadContent className="py-4" />
      </div>
      <MessageSuggestions />
      <div className="p-4 border-t border-gray-200">
        <MessageInput contextKey={contextKey} />
      </div>
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";

export { MessageThreadFull };
