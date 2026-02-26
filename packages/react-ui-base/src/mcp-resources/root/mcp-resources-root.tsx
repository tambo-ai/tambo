"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTamboMcpResourceList } from "@tambo-ai/react/mcp";
import * as React from "react";
import { McpResourcesContext } from "./mcp-resources-context";

export interface McpResourcesRootState extends Record<string, unknown> {
  slot: string;
  resourceCount: number;
  isLoading: boolean;
  hasSearch: boolean;
}

type McpResourcesRootComponentProps = useRender.ComponentProps<
  "div",
  McpResourcesRootState
>;

export interface McpResourcesRootProps extends McpResourcesRootComponentProps {
  /** Callback invoked when a resource is selected. */
  onSelectResource?: (uri: string, label: string) => void;
}

/**
 * Root component for MCP resource picker.
 * Provides resource list, search state, and selection callbacks to children.
 */
export const McpResourcesRoot = React.forwardRef<
  HTMLDivElement,
  McpResourcesRootProps
>(({ onSelectResource, ...props }, ref) => {
  const [search, setSearch] = React.useState("");
  const { data: resources, isLoading } = useTamboMcpResourceList(search);

  const resourceList = React.useMemo(() => resources ?? [], [resources]);
  const hasResources = resourceList.length > 0;

  const handleSelectResource = React.useCallback(
    (uri: string, label: string) => {
      onSelectResource?.(uri, label);
    },
    [onSelectResource],
  );

  const contextValue = React.useMemo(
    () => ({
      resources: resourceList,
      isLoading,
      search,
      setSearch,
      onSelectResource: handleSelectResource,
    }),
    [resourceList, isLoading, search, handleSelectResource],
  );

  const { render, ...componentProps } = props;
  const state: McpResourcesRootState = {
    slot: "mcp-resources",
    resourceCount: resourceList.length,
    isLoading,
    hasSearch: search.length > 0,
  };

  const element = useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
    enabled: hasResources,
  });

  if (!hasResources && !isLoading) {
    return null;
  }

  return (
    <McpResourcesContext.Provider value={contextValue}>
      {element}
    </McpResourcesContext.Provider>
  );
});
McpResourcesRoot.displayName = "McpResources.Root";
