"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpResourcesContext } from "../root/mcp-resources-context";

export interface McpResourcesSearchState extends Record<string, unknown> {
  slot: string;
  search: string;
}

type McpResourcesSearchComponentProps = useRender.ComponentProps<
  "input",
  McpResourcesSearchState
>;

export type McpResourcesSearchProps = McpResourcesSearchComponentProps;

/**
 * Search input for filtering MCP resources.
 * Wired to the search state from context.
 */
export const McpResourcesSearch = React.forwardRef<
  HTMLInputElement,
  McpResourcesSearchProps
>((props, ref) => {
  const { search, setSearch } = useMcpResourcesContext();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const { render, ...componentProps } = props;
  const state: McpResourcesSearchState = {
    slot: "mcp-resources-search",
    search,
  };

  return useRender({
    defaultTagName: "input",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "text",
      value: search,
      onChange: handleChange,
    }),
  });
});
McpResourcesSearch.displayName = "McpResources.Search";
