"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ThreadContent } from "@/components/ui/thread-content";
import { MessageInput } from "@/components/ui/message-input";
import { useTambo } from "@tambo-ai/react";

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
        "flex flex-col bg-white rounded-lg shadow-sm overflow-hidden bg-background h-[600px] w-full min-w-2xl max-w-2xl border border-gray-200",
        className,
      )}
      {...props}
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Chat with tambo</h2>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [scroll-behavior:smooth]"
      >
        <ThreadContent className="py-4" />
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <MessageInput
            contextKey={contextKey}
            className="[&_form]:w-full [&_div]:w-full"
          />
        </div>
      </div>
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";

export { MessageThreadFull };
