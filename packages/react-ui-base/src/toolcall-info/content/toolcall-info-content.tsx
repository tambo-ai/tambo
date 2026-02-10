"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoContentRenderProps {
  /** The message containing the tool call. */
  message: TamboThreadMessage;
  /** Whether the content is expanded. */
  isExpanded: boolean;
}

export interface ToolcallInfoContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Force visibility regardless of expanded state (for custom animations). */
  forceMount?: boolean;
  /** Static children or render function for custom content. */
  children?:
    | React.ReactNode
    | ((props: ToolcallInfoContentRenderProps) => React.ReactNode);
}

/**
 * Collapsible content area for toolcall details.
 */
export const ToolcallInfoContent = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoContentProps
>(({ asChild, forceMount, children, ...props }, ref) => {
  const { isExpanded, detailsId, message } = useToolcallInfoContext();

  if (!forceMount && !isExpanded) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  const renderProps: ToolcallInfoContentRenderProps = {
    message,
    isExpanded,
  };

  return (
    <Comp
      ref={ref}
      id={detailsId}
      data-slot="toolcall-info-content"
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {typeof children === "function" ? children(renderProps) : children}
    </Comp>
  );
});
ToolcallInfoContent.displayName = "ToolcallInfo.Content";
