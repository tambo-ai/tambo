"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../../types/component-render-or-children";

export type McpResourceButtonTriggerProps = BaseProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>;

/**
 * Trigger button primitive for the MCP resource button.
 * Renders a button element (or a Slot when asChild is true) that can be
 * used to open the dropdown menu.
 * @returns The trigger button element
 */
export const McpResourceButtonTrigger = React.forwardRef<
  HTMLButtonElement,
  McpResourceButtonTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      data-slot="mcp-resource-button-trigger"
      aria-label="Insert MCP Resource"
      {...props}
    >
      {children}
    </Comp>
  );
});
McpResourceButtonTrigger.displayName = "McpResourceButton.Trigger";
