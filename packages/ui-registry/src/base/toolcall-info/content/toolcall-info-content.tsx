"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Force visibility regardless of expanded state (for custom animations). */
  forceMount?: boolean;
}

/**
 * Collapsible content area for toolcall details.
 */
export const ToolcallInfoContent = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoContentProps
>(({ asChild, forceMount, children, ...props }, ref) => {
  const { isExpanded, detailsId } = useToolcallInfoContext();

  if (!forceMount && !isExpanded) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      id={detailsId}
      data-slot="toolcall-info-content"
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
ToolcallInfoContent.displayName = "ToolcallInfo.Content";
