"use client";

import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTamboThread } from "@tambo-ai/react";
import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";

/**
 * Props for the CanvasSpace component
 * @interface
 */
interface CanvasSpaceProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Position of the canvas space, either 'left' or 'right' (default: 'right') */
  position?: "left" | "right";
  /** Whether the canvas space is the only panel visible (default: false), useful for when using the control bar */
  isAlone?: boolean;
}

/**
 * A resizable canvas space component that displays rendered components from chat messages.
 * Supports dynamic resizing, automatic scrolling, and component rendering from thread messages.
 * @component
 * @example
 * ```tsx
 * <CanvasSpace
 *   position="right"
 *   isAlone={false}
 *   className="custom-styles"
 * />
 * ```
 */
export function CanvasSpace({
  className,
  position = "right",
  isAlone = false,
}: CanvasSpaceProps) {
  // Access the current Tambo thread context
  const { thread } = useTamboThread();

  // State for managing the currently rendered component
  const [renderedComponent, setRenderedComponent] =
    useState<React.ReactNode | null>(null);

  // Ref for the scrollable container to enable auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State and refs for managing canvas resizing
  const [, setWidth] = useState(768);
  const isResizing = useRef(false);
  const lastUpdateRef = useRef(0);

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
   * by default the canvas space is 25% of the window width
   * Effect to initialize canvas width CSS variable on mount and handle window resize
   * Only runs on client-side
   */
  useEffect(() => {
    // Guard for SSR
    if (typeof window === "undefined") return;

    const updateCanvasWidth = () => {
      try {
        const newWidth = Math.round(window.innerWidth * 0.4);
        setWidth(newWidth);

        // Guard against missing document during SSR
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty(
            "--canvas-width",
            `${newWidth}px`,
          );

          if (position === "right") {
            document.documentElement.style.setProperty(
              "--panel-left-width",
              `${Math.round(window.innerWidth * 0.6)}px`,
            );
          } else {
            document.documentElement.style.setProperty(
              "--panel-right-width",
              `${Math.round(window.innerWidth * 0.6)}px`,
            );
          }
        }
      } catch (error) {
        console.error("Error updating canvas width:", error);
      }
    };

    // Set initial width
    updateCanvasWidth();

    // Add resize listener
    window.addEventListener("resize", updateCanvasWidth);

    return () => {
      window.removeEventListener("resize", updateCanvasWidth);
    };
  }, [position]);

  /**
   * Effect to update canvas position CSS variable when position changes
   * Only runs on client-side
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--canvas-position", position);
  }, [position]);

  /**
   * Handles mouse movement during canvas resizing
   * Updates canvas width and adjusts panel widths accordingly
   * Includes throttling to prevent excessive updates
   */
  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (
        !isResizing.current ||
        typeof window === "undefined" ||
        typeof document === "undefined"
      )
        return;

      // Throttle updates to ~60fps
      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const windowWidth = window.innerWidth;

      requestAnimationFrame(() => {
        try {
          let newWidth;
          if (position === "right") {
            newWidth = Math.round(windowWidth - e.clientX);
            // Update panel width to fill remaining space
            const remainingWidth = windowWidth - newWidth;
            document.documentElement.style.setProperty(
              "--panel-left-width",
              `${remainingWidth}px`,
            );
          } else {
            newWidth = Math.round(e.clientX);
            // Update panel width to fill remaining space
            const remainingWidth = windowWidth - newWidth;
            document.documentElement.style.setProperty(
              "--panel-right-width",
              `${remainingWidth}px`,
            );
          }

          // Ensure minimum width of 300px for both components
          const clampedWidth = Math.max(
            300,
            Math.min(windowWidth - 300, newWidth),
          );
          setWidth(clampedWidth);
          document.documentElement.style.setProperty(
            "--canvas-width",
            `${clampedWidth}px`,
          );
        } catch (error) {
          console.error("Error during resize:", error);
        }
      });
    },
    [position],
  );

  /**
   * Handles the end of a resize operation
   * Cleans up event listeners and resets cursor styles
   */
  const stopResizing = useCallback(() => {
    if (typeof document === "undefined") return;

    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  }, [handleMouseMove]);

  /**
   * Initiates the canvas resize operation
   * Sets up event listeners and cursor styles
   */
  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      if (typeof document === "undefined") return;

      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
    },
    [handleMouseMove, stopResizing],
  );

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
        "fixed top-0 bottom-0 flex border-x border-flat",
        position === "right" ? "right-0" : "left-0",
        isAlone && "left-0 right-0 -z-10",
      )}
    >
      <div
        className={cn(
          "relative bg-white/50 backdrop-blur-sm",
          "h-screen overflow-hidden",
          "transition-[width] duration-75 ease-out",
          className,
        )}
        style={{ width: isAlone ? "100%" : `var(--canvas-width)` }}
      >
        {/* Resize handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-ew-resize hover:bg-gray-300 transition-colors z-50",
            position === "right" ? "left-0" : "right-0",
            isAlone && "hidden",
          )}
          onMouseDown={startResizing}
        />
        {/* Canvas content container */}
        <div className="absolute inset-0 flex flex-col">
          <div
            ref={scrollContainerRef}
            className="w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
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
                    <p className="text-gray-600 font-medium">Canvas is empty</p>
                    <p className="text-sm text-gray-500">
                      Interactive components will appear here as they are
                      generated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
