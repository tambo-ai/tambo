"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoParametersRenderProps extends Record<
  string,
  unknown
> {
  parameters: Record<string, unknown> | undefined;
  parametersString: string;
}

export type ToolcallInfoParametersProps = useRender.ComponentProps<
  "span",
  ToolcallInfoParametersRenderProps
>;

/**
 * Displays the tool parameters.
 */
export const ToolcallInfoParameters = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoParametersProps
>(({ ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();

  const parameters = toolCallRequest?.input;
  const renderProps: ToolcallInfoParametersRenderProps = {
    parameters,
    parametersString: JSON.stringify(parameters, null, 2),
  };
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-parameters",
    }),
  });
});
ToolcallInfoParameters.displayName = "ToolcallInfo.Parameters";
