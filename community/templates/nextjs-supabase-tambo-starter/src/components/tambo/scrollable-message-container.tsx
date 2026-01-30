"use client";

import { GenerationStage, useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

export type ScrollableMessageContainerProps =
  React.HTMLAttributes<HTMLDivElement>;

export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { thread } = useTambo();
  const [shouldAutoscroll, setShouldAutoscroll] = useState(true);
  const lastScrollTopRef = useRef(0);

  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  const messagesContent = useMemo(() => {
    if (!thread.messages) return null;

    return thread.messages.map((message) => ({
      id: message.id,
      content: message.content,
      tool_calls: message.tool_calls,
      component: message.component,
      reasoning: message.reasoning,
      componentState: message.componentState,
    }));
  }, [thread.messages]);

  const generationStage = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => thread?.generationStage ?? GenerationStage.IDLE,
    [thread?.generationStage],
  );

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    const isAtBottom =
      Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    if (scrollTop < lastScrollTopRef.current) {
      setShouldAutoscroll(false);
    } else if (isAtBottom) {
      setShouldAutoscroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current || !messagesContent || !shouldAutoscroll)
      return;

    const scroll = () => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    };

    if (generationStage === GenerationStage.STREAMING_RESPONSE) {
      requestAnimationFrame(scroll);
    } else {
      const timeoutId = setTimeout(scroll, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messagesContent, generationStage, shouldAutoscroll]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        `
          absolute inset-0
          overflow-y-auto
          min-h-0 min-w-0
          bg-transparent
        `,
        /* Vertical scrollbar (neutral, ops-safe) */
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-orange-500/40",
        "[&::-webkit-scrollbar-thumb]  :rounded-full",
        "[&::-webkit-scrollbar-track]:bg-transparent",


        /* Horizontal scrollbar */
        "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        className,
      )}
      data-slot="scrollable-message-container"
      {...props}
    >
      {children}
    </div>
  );
});

ScrollableMessageContainer.displayName =
  "ScrollableMessageContainer";
