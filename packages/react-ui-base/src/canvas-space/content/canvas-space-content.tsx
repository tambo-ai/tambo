"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useCanvasSpaceRootContext } from "../root/canvas-space-root-context";

/**
 * Props passed to the render callback of CanvasSpaceContent.
 */
export interface CanvasSpaceContentRenderProps {
  /** The rendered component from the current thread. */
  renderedComponent: React.ReactNode;
}

export type CanvasSpaceContentProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Content primitive for the canvas space.
 * Renders only when a component is available in the canvas.
 * Displays the rendered component from the current thread.
 * Supports a render prop to customize how the component is displayed.
 * @returns The content element with the rendered component, or null if empty
 */
export const CanvasSpaceContent = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    CanvasSpaceContentProps,
    CanvasSpaceContentRenderProps
  >
>(function CanvasSpaceContent({ asChild, ...props }, ref) {
  const { renderedComponent } = useCanvasSpaceRootContext();

  const { content, componentProps } = useRender(props, {
    renderedComponent: renderedComponent!,
  });

  if (!renderedComponent) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="canvas-space-content" {...componentProps}>
      {content ?? renderedComponent}
    </Comp>
  );
});
