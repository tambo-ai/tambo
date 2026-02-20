"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoStatusTextRenderProps extends Record<
  string,
  unknown
> {
  toolStatusMessage: string;
}

export type ToolcallInfoStatusTextProps = useRender.ComponentProps<
  "span",
  ToolcallInfoStatusTextRenderProps
>;

/**
 * Displays the tool status message text.
 */
export const ToolcallInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusTextProps
>(({ children, ...props }, ref) => {
  const { toolStatusMessage } = useToolcallInfoContext();
  const { render, ...componentProps } = props;
  const renderProps: ToolcallInfoStatusTextRenderProps = {
    toolStatusMessage,
  };

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      children: children ?? toolStatusMessage,
      "data-slot": "toolcall-info-status-text",
    }),
  });
});
ToolcallInfoStatusText.displayName = "ToolcallInfo.StatusText";
