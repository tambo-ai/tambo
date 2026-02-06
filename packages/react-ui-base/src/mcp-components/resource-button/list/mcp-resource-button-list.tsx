"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../../types/component-render-or-children";
import { useRender } from "../../../use-render/use-render";
import {
  useMcpResourceButtonContext,
  type McpResourceEntry,
} from "../root/mcp-resource-button-context";

export interface McpResourceButtonListRenderProps {
  /** Filtered list of resources based on search query */
  filteredResources: McpResourceEntry[];
  /** Whether the list is loading */
  isLoading: boolean;
  /** Whether there are no resources matching the search */
  isEmpty: boolean;
  /** Current search query */
  searchQuery: string;
}

export type McpResourceButtonListProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  McpResourceButtonListRenderProps
>;

/**
 * List container primitive for resource items.
 * Provides render props with filtered resource list data for custom rendering.
 * @returns The list container element
 */
export const McpResourceButtonList = React.forwardRef<
  HTMLDivElement,
  McpResourceButtonListProps
>((props, ref) => {
  const { filteredResources, isLoading, searchQuery } =
    useMcpResourceButtonContext();

  const renderProps: McpResourceButtonListRenderProps = {
    filteredResources,
    isLoading,
    isEmpty: filteredResources.length === 0,
    searchQuery,
  };

  const { content, componentProps } = useRender(props, renderProps);
  const { asChild, ...rest } = componentProps;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} role="menu" data-slot="mcp-resource-button-list" {...rest}>
      {content}
    </Comp>
  );
});
McpResourceButtonList.displayName = "McpResourceButton.List";
