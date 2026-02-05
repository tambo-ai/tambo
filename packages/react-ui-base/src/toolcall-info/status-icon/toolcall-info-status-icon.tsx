"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export type ToolStatus = "error" | "loading" | "success";

function getToolStatus(
  hasToolError: boolean,
  isLoading: boolean | undefined,
): ToolStatus {
  if (hasToolError) return "error";
  if (isLoading) return "loading";
  return "success";
}

export interface ToolcallInfoStatusIconRenderProps {
  status: ToolStatus;
}

export type ToolcallInfoStatusIconProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLSpanElement>,
  ToolcallInfoStatusIconRenderProps
>;

/**
 * Status icon component. Provides status data for custom rendering.
 */
export const ToolcallInfoStatusIcon = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusIconProps
>(({ asChild, ...props }, ref) => {
  const { hasToolError, isLoading } = useToolcallInfoContext();

  const status = getToolStatus(hasToolError, isLoading);

  const Comp = asChild ? Slot : "span";

  const { content, componentProps } = useRender(props, { status });

  return (
    <Comp
      ref={ref}
      data-slot="toolcall-info-status-icon"
      data-status={status}
      {...componentProps}
    >
      {content}
    </Comp>
  );
});
ToolcallInfoStatusIcon.displayName = "ToolcallInfo.StatusIcon";
