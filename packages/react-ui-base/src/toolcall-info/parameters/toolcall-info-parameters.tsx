"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export type ToolcallInfoParametersProps = useRender.ComponentProps<"span">;

/**
 * Displays the tool parameters.
 */
export const ToolcallInfoParameters = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoParametersProps
>(({ children, ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();

  const parameters = toolCallRequest?.input;
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-parameters",
      parameters,
      parametersString: JSON.stringify(parameters, null, 2),
      children: children ?? JSON.stringify(parameters, null, 2),
    }),
  });
});
ToolcallInfoParameters.displayName = "ToolcallInfo.Parameters";
