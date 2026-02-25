"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoToolNameRenderProps extends Record<
  string,
  unknown
> {
  slot: string;
  toolName?: string;
}

export type ToolcallInfoToolNameProps = useRender.ComponentProps<
  "span",
  ToolcallInfoToolNameRenderProps
>;

/**
 * Displays the tool name.
 */
export const ToolcallInfoToolName = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoToolNameProps
>(({ children, ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: { slot: "toolcall-info-tool-name", toolName: toolCallRequest?.name },
    props: mergeProps(componentProps, {
      toolName: toolCallRequest?.name,
      children: children ?? toolCallRequest?.name,
    }),
  });
});
ToolcallInfoToolName.displayName = "ToolcallInfo.ToolName";
