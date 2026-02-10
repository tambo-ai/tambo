"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
}

/**
 * Trigger button for expanding/collapsing toolcall details.
 */
export const ToolcallInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ToolcallInfoTriggerProps
>(({ asChild, onClick, children, ...props }, ref) => {
  const { isExpanded, setIsExpanded, detailsId } = useToolcallInfoContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsExpanded(!isExpanded);
    onClick?.(e);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      aria-expanded={isExpanded}
      aria-controls={detailsId}
      onClick={handleClick}
      data-slot="toolcall-info-trigger"
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
    </Comp>
  );
});
ToolcallInfoTrigger.displayName = "ToolcallInfo.Trigger";
