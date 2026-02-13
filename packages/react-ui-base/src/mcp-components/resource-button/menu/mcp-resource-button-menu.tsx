"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../../types/component-render-or-children";

export type McpResourceButtonMenuProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement>
>;

/**
 * Menu container primitive for the MCP resource button.
 * Renders a container for the dropdown content with search and resource list.
 * Typically used with a dropdown library like Radix DropdownMenu.
 * @returns The menu container element
 */
export const McpResourceButtonMenu = React.forwardRef<
  HTMLDivElement,
  McpResourceButtonMenuProps
>(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="mcp-resource-button-menu" {...props}>
      {children}
    </Comp>
  );
});
McpResourceButtonMenu.displayName = "McpResourceButton.Menu";
