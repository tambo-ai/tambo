"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoTriggerRenderProps extends Record<
  string,
  unknown
> {
  state: "open" | "closed";
}

export type ToolcallInfoTriggerProps = useRender.ComponentProps<
  "button",
  ToolcallInfoTriggerRenderProps
>;

/**
 * Trigger button for expanding/collapsing toolcall details.
 */
export const ToolcallInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ToolcallInfoTriggerProps
>((props, ref) => {
  const { isExpanded, setIsExpanded, detailsId } = useToolcallInfoContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsExpanded(!isExpanded);
    e.preventDefault();
  };
  const { render, ...componentProps } = props;
  const renderProps: ToolcallInfoTriggerRenderProps = {
    state: isExpanded ? "open" : "closed",
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      type: "button",
      "aria-expanded": isExpanded,
      "aria-controls": detailsId,
      onClick: handleClick,
      "data-slot": "toolcall-info-trigger",
    }),
  });
});
ToolcallInfoTrigger.displayName = "ToolcallInfo.Trigger";
