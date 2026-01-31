"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { keyifyParameters } from "../root/keyify-parameters";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoParametersRenderProps {
  parameters: Record<string, unknown> | undefined;
  parametersString: string;
}

export type ToolcallInfoParametersProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLSpanElement>,
  ToolcallInfoParametersRenderProps
>;

/**
 * Displays the tool parameters.
 */
export const ToolcallInfoParameters = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoParametersProps
>(({ asChild, ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();

  const keyifiedParams = keyifyParameters(toolCallRequest?.parameters);

  const Comp = asChild ? Slot : "span";

  const { content, componentProps } = useRender(props, {
    parameters: keyifiedParams,
    parametersString: JSON.stringify(keyifiedParams, null, 2),
  });
  return (
    <Comp ref={ref} data-slot="toolcall-info-parameters" {...componentProps}>
      {content}
    </Comp>
  );
});
ToolcallInfoParameters.displayName = "ToolcallInfo.Parameters";
