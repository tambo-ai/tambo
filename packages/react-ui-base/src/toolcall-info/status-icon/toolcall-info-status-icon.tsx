"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
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

export interface ToolcallInfoStatusIconRenderProps extends Record<
  string,
  unknown
> {
  status: ToolStatus;
}

export type ToolcallInfoStatusIconProps = useRender.ComponentProps<
  "span",
  ToolcallInfoStatusIconRenderProps
>;

/**
 * Status icon component. Provides status data for custom rendering.
 */
export const ToolcallInfoStatusIcon = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusIconProps
>(({ ...props }, ref) => {
  const { hasToolError, isLoading } = useToolcallInfoContext();

  const status = getToolStatus(hasToolError, isLoading);
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: { status },
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-status-icon",
      "data-status": status,
    }),
  });
});
ToolcallInfoStatusIcon.displayName = "ToolcallInfo.StatusIcon";
