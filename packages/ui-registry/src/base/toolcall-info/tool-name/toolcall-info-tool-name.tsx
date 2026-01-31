"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoToolNameRenderProps {
  toolName?: string;
}

export type ToolcallInfoToolNameProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLSpanElement>,
  ToolcallInfoToolNameRenderProps
>;

/**
 * Displays the tool name.
 */
export const ToolcallInfoToolName = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoToolNameProps
>(({ asChild, ...props }, ref) => {
  const { toolCallRequest } = useToolcallInfoContext();

  const Comp = asChild ? Slot : "span";

  const { content, componentProps } = useRender(props, {
    toolName: toolCallRequest?.toolName,
  });

  return (
    <Comp ref={ref} data-slot="toolcall-info-tool-name" {...componentProps}>
      {content}
    </Comp>
  );
});
ToolcallInfoToolName.displayName = "ToolcallInfo.ToolName";
