"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoContentRenderProps extends Record<
  string,
  unknown
> {
  /** The message containing the tool call. */
  message: TamboThreadMessage;
  /** Whether the content is expanded. */
  isExpanded: boolean;
}

type ToolcallInfoContentComponentProps = useRender.ComponentProps<
  "div",
  ToolcallInfoContentRenderProps
>;

export interface ToolcallInfoContentProps extends ToolcallInfoContentComponentProps {
  /** Force visibility regardless of expanded state (for custom animations). */
  forceMount?: boolean;
}

/**
 * Collapsible content area for toolcall details.
 */
export const ToolcallInfoContent = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoContentProps
>(({ forceMount, ...props }, ref) => {
  const { isExpanded, detailsId, message } = useToolcallInfoContext();

  if (!forceMount && !isExpanded) {
    return null;
  }
  const { render, ...componentProps } = props;

  const renderProps: ToolcallInfoContentRenderProps = {
    message,
    isExpanded,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      id: detailsId,
      "data-slot": "toolcall-info-content",
      "data-state": isExpanded ? "open" : "closed",
    }),
  });
});
ToolcallInfoContent.displayName = "ToolcallInfo.Content";
