"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../../types/component-render-or-children";

export type McpPromptButtonMenuProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Menu container primitive for the MCP prompt button.
 * Renders a container for the dropdown content.
 * Typically used with a dropdown library like Radix DropdownMenu.
 * @returns The menu container element
 */
export const McpPromptButtonMenu = React.forwardRef<
  HTMLDivElement,
  McpPromptButtonMenuProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="mcp-prompt-button-menu" {...props}>
      {children}
    </Comp>
  );
});
McpPromptButtonMenu.displayName = "McpPromptButton.Menu";
