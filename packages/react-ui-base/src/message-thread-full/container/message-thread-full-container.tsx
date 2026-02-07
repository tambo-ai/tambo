"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useMergeRefs } from "../../utils/use-merge-refs";
import { useMessageThreadFullContext } from "../root/message-thread-full-context";

/**
 * Props passed to the Container render function.
 */
export interface MessageThreadFullContainerRenderProps {
  /** Whether canvas space is present in the layout. */
  hasCanvasSpace: boolean;
  /** Whether the canvas is positioned on the left side. */
  canvasIsOnLeft: boolean;
  /** Whether this thread is positioned as a left panel. */
  isLeftPanel: boolean;
  /** Which side the history sidebar is positioned on. */
  historyPosition: "left" | "right";
  /** Whether sidebar spacing is disabled. */
  disableSidebarSpacing: boolean;
}

export interface MessageThreadFullContainerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /**
   * Whether to disable automatic sidebar spacing.
   * When true, the component will not add margins for the sidebar.
   * Useful when the sidebar is positioned externally (e.g., in a flex container).
   * @default false
   */
  disableSidebarSpacing?: boolean;
  /** Children as ReactNode or render function receiving container state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadFullContainerRenderProps) => React.ReactNode);
}

/**
 * Container primitive for the message thread full component.
 * Reads layout context from Root and renders a responsive div that adjusts
 * based on canvas presence and sidebar position.
 * Forwards ref (merged with containerRef from context).
 * @returns The container element with layout-aware data attributes
 */
export const MessageThreadFullContainer = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullContainerProps
>(function MessageThreadFullContainer(
  { children, asChild, disableSidebarSpacing = false, ...props },
  ref,
) {
  const { containerRef, hasCanvasSpace, canvasIsOnLeft, isLeftPanel, historyPosition } =
    useMessageThreadFullContext();

  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, containerRef);

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children({
      hasCanvasSpace,
      canvasIsOnLeft,
      isLeftPanel,
      historyPosition,
      disableSidebarSpacing,
    });
  } else {
    content = children;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={mergedRef}
      data-slot="message-thread-full-container"
      data-has-canvas={hasCanvasSpace}
      data-canvas-left={canvasIsOnLeft}
      data-left-panel={isLeftPanel}
      {...props}
    >
      {content}
    </Comp>
  );
});
