"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
  useMcpResourceButtonContext,
  type McpResourceEntry,
} from "../root/mcp-resource-button-context";

export interface McpResourceButtonItemRenderProps {
  /** The resource entry data */
  resource: McpResourceEntry;
  /** The resource URI */
  uri: string;
  /** The resource name, if any */
  name: string | undefined;
  /** The resource description, if any */
  description: string | undefined;
}

export interface McpResourceButtonItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick" | "children" | "resource"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** The resource entry to render */
  resource: McpResourceEntry;
  /** Optional click handler override (defaults to selecting the resource) */
  onSelect?: () => void;
  /** Children as ReactNode or render function */
  children?:
    | React.ReactNode
    | ((props: McpResourceButtonItemRenderProps) => React.ReactNode);
}

/**
 * Item primitive for displaying a single resource option.
 * Renders a clickable item that selects the resource when clicked.
 * @returns The resource item element
 */
export const McpResourceButtonItem = React.forwardRef<
  HTMLDivElement,
  McpResourceButtonItemProps
>(({ resource, onSelect, asChild, children, ...props }, ref) => {
  const { onSelectResource } = useMcpResourceButtonContext();

  const renderProps: McpResourceButtonItemRenderProps = {
    resource,
    uri: resource.resource.uri,
    name: resource.resource.name,
    description: resource.resource.description,
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      onSelectResource(
        resource.resource.uri,
        resource.resource.name ?? resource.resource.uri,
      );
    }
  };

  const Comp = asChild ? Slot : "div";
  const content =
    typeof children === "function" ? children(renderProps) : children;

  return (
    <Comp
      ref={ref}
      role="menuitem"
      tabIndex={0}
      data-slot="mcp-resource-button-item"
      onClick={handleClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      {...props}
    >
      {content}
    </Comp>
  );
});
McpResourceButtonItem.displayName = "McpResourceButton.Item";
