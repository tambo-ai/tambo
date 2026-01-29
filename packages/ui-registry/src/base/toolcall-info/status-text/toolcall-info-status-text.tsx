"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoStatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
}

/**
 * Displays the tool status message text.
 */
export const ToolcallInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ToolcallInfoStatusTextProps
>(({ asChild, children, ...props }, ref) => {
  const { toolStatusMessage } = useToolcallInfoContext();

  const Comp = asChild ? Slot : "span";

  return (
    <Comp ref={ref} data-slot="toolcall-info-status-text" {...props}>
      {children ?? toolStatusMessage}
    </Comp>
  );
});
ToolcallInfoStatusText.displayName = "ToolcallInfo.StatusText";
