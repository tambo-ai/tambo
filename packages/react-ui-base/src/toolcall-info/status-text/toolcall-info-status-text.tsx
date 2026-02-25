"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export type ToolcallInfoStatusTextProps = useRender.ComponentProps<"span">;

/**
 * Displays the tool status message text.
 */
export const ToolcallInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusTextProps
>(({ children, ...props }, ref) => {
  const { toolStatusMessage } = useToolcallInfoContext();
  const { render, ...componentProps } = props;

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    state: {
      slot: "toolcall-info-status-text",
      toolStatusMessage,
    },
    stateAttributesMapping: {
      toolStatusMessage: () => null,
    },
    props: mergeProps(componentProps, {
      children: children ?? toolStatusMessage,
    }),
  });
});
ToolcallInfoStatusText.displayName = "ToolcallInfo.StatusText";
