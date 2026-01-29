"use client";

import { cn } from "@/lib/utils";
import { useTamboThread } from "@tambo-ai/react";
import * as React from "react";

export type ScrollableMessageContainerProps =
  React.HTMLAttributes<HTMLDivElement>;

export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, ...props }, ref) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { thread, isIdle } = useTamboThread();
  const [shouldAutoscroll, setShouldAutoscroll] = React.useState(true);
  const lastScrollTopRef = React.useRef(0);

  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  const messagesContent = React.useMemo(() => {
    if (!thread.messages) return null;
    return thread.messages.map((message) => ({
      id: message.id,
      content: message.content,
      tool_calls: message.tool_calls,
    }));
  }, [thread.messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    if (scrollTop < lastScrollTopRef.current) {
      setShouldAutoscroll(false);
    } else if (isAtBottom) {
      setShouldAutoscroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  };

  React.useEffect(() => {
    if (scrollContainerRef.current && messagesContent && shouldAutoscroll) {
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [messagesContent, shouldAutoscroll, isIdle]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn("flex-1 overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollableMessageContainer.displayName = "ScrollableMessageContainer";
