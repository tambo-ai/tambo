"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoToolNameRenderProps extends Record<
  string,
  unknown
> {
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
>(({ ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();
  const renderProps: ToolcallInfoToolNameRenderProps = {
    toolName: toolCallRequest?.name,
  };
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-tool-name",
    }),
  });
});
ToolcallInfoToolName.displayName = "ToolcallInfo.ToolName";
