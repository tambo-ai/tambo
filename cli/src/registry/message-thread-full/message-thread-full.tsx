"use client";

import {
  MessageInputRoot,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
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
import { ThreadHistory } from "@/components/ui/thread-history";
import type { messageVariants } from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Props for the CanvasAwareContainer component
 */
interface CanvasAwareContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to enable canvas space integration */
  enableCanvasSpace?: boolean;
  /** Children elements to render inside the container */
  children: React.ReactNode;
}

/**
 * A container component that adjusts its width and position based on canvas space settings
 */
const CanvasAwareContainer = React.forwardRef<
  HTMLDivElement,
  CanvasAwareContainerProps
>(({ enableCanvasSpace = false, className, children, ...props }, ref) => {
  // Get canvas position from CSS variable
  const getCanvasPosition = () => {
    if (typeof document === "undefined") return "right";
    return (
      document.documentElement.style.getPropertyValue("--canvas-position") ||
      "right"
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col bg-white rounded-lg overflow-hidden bg-background",
        "h-screen",
        enableCanvasSpace
          ? getCanvasPosition() === "right"
            ? "w-[calc(100%-var(--canvas-width))]"
            : "w-[calc(100%-var(--canvas-width))] ml-[var(--canvas-width)]"
          : "w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto",
        "transition-[width,margin] duration-75 ease-out",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CanvasAwareContainer.displayName = "CanvasAwareContainer";

/**
 * Props for the ScrollableMessageContainer component
 */
interface ScrollableMessageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Children elements to render inside the container */
  children: React.ReactNode;
}

/**
 * A scrollable container for message content with auto-scroll functionality
 */
const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
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
        "flex-1 overflow-y-auto px-4",
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
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional context key for the thread */
  contextKey?: string;
  /** Whether to enable the canvas space */
  enableCanvasSpace?: boolean;
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(
  (
    { className, contextKey, enableCanvasSpace = false, variant, ...props },
    ref,
  ) => {
    return (
      <CanvasAwareContainer
        ref={ref}
        enableCanvasSpace={enableCanvasSpace}
        className={className}
        {...props}
      >
        {/* Message thread history */}
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Use AI</h2>
          <ThreadHistory contextKey={contextKey} />
        </div>

        {/* Message thread content */}
        <ScrollableMessageContainer>
          <ThreadContentRoot
            enableCanvasSpace={enableCanvasSpace}
            className="py-4"
            variant={variant}
          >
            <ThreadContentMessages />
          </ThreadContentRoot>
        </ScrollableMessageContainer>

        {/* Message input */}
        <div className="p-4">
          <MessageInputRoot contextKey={contextKey}>
            <MessageInputTextarea />
            <MessageInputToolbar>
              <MessageInputSubmitButton />
            </MessageInputToolbar>
          </MessageInputRoot>
        </div>

        {/* Message suggestions */}
        <MessageSuggestionsRoot>
          <MessageSuggestionsStatus />
          <MessageSuggestionsList />
        </MessageSuggestionsRoot>
      </CanvasAwareContainer>
    );
  },
);
MessageThreadFull.displayName = "MessageThreadFull";
