"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useCanvasSpaceRootContext } from "../root/canvas-space-root-context";

export type CanvasSpaceEmptyStateProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Empty state primitive for the canvas space.
 * Renders only when no component is available in the canvas.
 * Provides a slot for custom empty state content.
 * @returns The empty state element, or null if a component is rendered
 */
export const CanvasSpaceEmptyState = React.forwardRef<
  HTMLDivElement,
  CanvasSpaceEmptyStateProps
>(function CanvasSpaceEmptyState({ children, asChild, ...props }, ref) {
  const { renderedComponent } = useCanvasSpaceRootContext();

  if (renderedComponent) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="canvas-space-empty-state" {...props}>
      {children}
    </Comp>
  );
});
