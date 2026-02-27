"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ListResourceEntry } from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMcpResourcesContext } from "../root/mcp-resources-context";

export interface McpResourcesListState extends Record<string, unknown> {
  slot: string;
  resources: ListResourceEntry[];
  resourceCount: number;
}

type McpResourcesListComponentProps = useRender.ComponentProps<
  "div",
  McpResourcesListState
>;

export type McpResourcesListProps = McpResourcesListComponentProps;

/**
 * List container for MCP resources.
 * Exposes the resource list via render state for consumer iteration.
 */
export const McpResourcesList = React.forwardRef<
  HTMLDivElement,
  McpResourcesListProps
>((props, ref) => {
  const { resources } = useMcpResourcesContext();

  const { render, ...componentProps } = props;
  const state: McpResourcesListState = {
    slot: "mcp-resources-list",
    resources,
    resourceCount: resources.length,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    stateAttributesMapping: {
      resources: () => null,
    },
    props: componentProps,
  });
});
McpResourcesList.displayName = "McpResources.List";
