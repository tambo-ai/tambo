"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useCanvasSpaceRootContext } from "../root/canvas-space-root-context";

export type CanvasSpaceViewportProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Viewport primitive for the canvas space.
 * Provides the scrollable container with auto-scroll behavior
 * when new components are rendered.
 * @returns The scrollable viewport element
 */
export const CanvasSpaceViewport = React.forwardRef<
  HTMLDivElement,
  CanvasSpaceViewportProps
>(function CanvasSpaceViewport({ children, asChild, ...props }, ref) {
  const { renderedComponent, scrollContainerRef } = useCanvasSpaceRootContext();

  /**
   * Auto-scroll to bottom when new components are rendered.
   * Includes a small delay to ensure smooth scrolling.
   */
  React.useEffect(() => {
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
  }, [renderedComponent, scrollContainerRef]);

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={(node: HTMLDivElement | null) => {
        // Assign to the context ref
        (
          scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;

        // Forward the external ref
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      data-slot="canvas-space-viewport"
      {...props}
    >
      {children}
    </Comp>
  );
});
