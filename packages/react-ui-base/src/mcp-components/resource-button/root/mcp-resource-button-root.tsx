"use client";

import { Slot } from "@radix-ui/react-slot";
import { useTamboMcpResourceList } from "@tambo-ai/react/mcp";
import * as React from "react";
import { BaseProps } from "../../../types/component-render-or-children";
import { McpResourceButtonContext } from "./mcp-resource-button-context";

export type McpResourceButtonRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Callback to insert a resource reference */
    onInsertResource: (id: string, label: string) => void;
    /** Current input value (unused but kept for API consistency) */
    value?: string;
  }
>;

/**
 * Root primitive for the MCP resource button compound component.
 * Provides context for child components including resource list data,
 * search state, and selection handlers.
 * Renders nothing if no resources are available.
 * @returns The root container element with MCP resource button context, or null if no resources
 */
export const McpResourceButtonRoot = React.forwardRef<
  HTMLDivElement,
  McpResourceButtonRootProps
>(function McpResourceButtonRoot(
  { children, asChild, onInsertResource, value: _value, ...props },
  ref,
) {
  const { data: resourceList, isLoading } = useTamboMcpResourceList();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter resources based on search query
  const filteredResources = React.useMemo(() => {
    if (!resourceList) return [];
    if (!searchQuery) return resourceList;

    const query = searchQuery.toLowerCase();
    return resourceList.filter((entry) => {
      const uri = entry.resource.uri.toLowerCase();
      const name = entry.resource.name?.toLowerCase() ?? "";
      const description = entry.resource.description?.toLowerCase() ?? "";
      // Check if any field contains the query
      return [
        uri.includes(query),
        name.includes(query),
        description.includes(query),
      ].some(Boolean);
    });
  }, [resourceList, searchQuery]);

  const handleSelectResource = React.useCallback(
    (id: string, label: string) => {
      onInsertResource(id, label);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onInsertResource],
  );

  const contextValue = React.useMemo(
    () => ({
      resourceList,
      filteredResources,
      isLoading,
      isOpen,
      setIsOpen,
      searchQuery,
      setSearchQuery,
      onSelectResource: handleSelectResource,
    }),
    [
      resourceList,
      filteredResources,
      isLoading,
      isOpen,
      searchQuery,
      handleSelectResource,
    ],
  );

  // Only show if resources are available
  if (!resourceList || resourceList.length === 0) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <McpResourceButtonContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="mcp-resource-button" {...props}>
        {children}
      </Comp>
    </McpResourceButtonContext.Provider>
  );
});
McpResourceButtonRoot.displayName = "McpResourceButton.Root";
