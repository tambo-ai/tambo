"use client";

import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTamboThread } from "@tambo-ai/react";
import { cn } from "@tambo-ai/ui-registry/utils";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Props for the CanvasSpace component
 * @interface
 */
interface CanvasSpaceProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * A canvas space component that displays rendered components from chat messages.
 * @component
 * @example
 * ```tsx
 * <CanvasSpace className="custom-styles" />
 * ```
 */
export function CanvasSpace({ className }: CanvasSpaceProps) {
  // Access the current Tambo thread context
  const { thread } = useTamboThread();

  // State for managing the currently rendered component
  const [renderedComponent, setRenderedComponent] =
    useState<React.ReactNode | null>(null);

  // Ref for the scrollable container to enable auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track previous thread ID to handle thread changes
  const previousThreadId = useRef<string | null>(null);

  /**
   * Effect to clear the canvas when switching between threads
   * Prevents components from previous threads being displayed in new threads
   */
  useEffect(() => {
    // If there's no thread, or if the thread ID changed, clear the canvas
    if (
      !thread ||
      (previousThreadId.current && previousThreadId.current !== thread.id)
    ) {
      setRenderedComponent(null);
    }

    // Update the previous thread ID reference
    previousThreadId.current = thread?.id ?? null;
  }, [thread]);

  /**
   * Effect to handle custom 'tambo:showComponent' events
   * Allows external triggers to update the rendered component
   */
  useEffect(() => {
    const handleShowComponent = (
      event: CustomEvent<{ messageId: string; component: React.ReactNode }>,
    ) => {
      try {
        setRenderedComponent(event.detail.component);
      } catch (error) {
        console.error("Failed to render component:", error);
        setRenderedComponent(null);
      }
    };

    window.addEventListener(
      "tambo:showComponent",
      handleShowComponent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "tambo:showComponent",
        handleShowComponent as EventListener,
      );
    };
  }, []);

  /**
   * Effect to automatically display the latest component from thread messages
   * Updates when thread messages change or new components are added
   */
  useEffect(() => {
    if (!thread?.messages) {
      setRenderedComponent(null);
      return;
    }

    const messagesWithComponents = thread.messages.filter(
      (msg: TamboThreadMessage) => msg.renderedComponent,
    );

    if (messagesWithComponents.length > 0) {
      const latestMessage =
        messagesWithComponents[messagesWithComponents.length - 1];
      setRenderedComponent(latestMessage.renderedComponent);
    }
  }, [thread?.messages]);

  /**
   * Effect to auto-scroll to bottom when new components are rendered
   * Includes a small delay to ensure smooth scrolling
   */
  useEffect(() => {
    if (scrollContainerRef.current && renderedComponent) {
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
  }, [renderedComponent]);

  return (
    <div
      className={cn(
        "h-screen flex-1 flex flex-col bg-background/50 backdrop-blur-sm overflow-hidden border-l border-border",
        className,
      )}
      data-canvas-space="true"
    >
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
      >
        <div className="p-8 h-full flex flex-col">
          {renderedComponent ? (
            <div className="h-full space-y-6 pb-8 flex flex-col items-center justify-center w-full">
              <div
                className={cn(
                  "w-full transition-all duration-200 ease-out transform flex justify-center",
                  "opacity-100 scale-100",
                )}
              >
                {renderedComponent}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">
                  Canvas is empty
                </p>
                <p className="text-sm text-muted-foreground">
                  Interactive components will appear here as they are generated
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
