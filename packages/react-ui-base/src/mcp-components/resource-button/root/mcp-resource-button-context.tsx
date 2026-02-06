"use client";

import * as React from "react";

/**
 * Represents a resource entry from MCP servers.
 */
export interface McpResourceEntry {
  server: { url: string } | null;
  resource: {
    uri: string;
    name?: string;
    description?: string;
  };
}

/**
 * Context value for the MCP resource button compound component.
 */
export interface McpResourceButtonContextValue {
  /** List of available resources from MCP servers */
  resourceList: McpResourceEntry[] | undefined;
  /** Filtered resources based on search query */
  filteredResources: McpResourceEntry[];
  /** Whether the resource list is loading */
  isLoading: boolean;
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Set the open state of the dropdown */
  setIsOpen: (open: boolean) => void;
  /** Current search query */
  searchQuery: string;
  /** Set the search query */
  setSearchQuery: (query: string) => void;
  /** Handler to select a resource */
  onSelectResource: (id: string, label: string) => void;
}

const McpResourceButtonContext =
  React.createContext<McpResourceButtonContextValue | null>(null);

/**
 * Hook to access the MCP resource button context.
 * @throws Error if used outside of McpResourceButton.Root
 * @returns The MCP resource button context value
 */
export function useMcpResourceButtonContext(): McpResourceButtonContextValue {
  const context = React.useContext(McpResourceButtonContext);
  if (!context) {
    throw new Error(
      "useMcpResourceButtonContext must be used within McpResourceButton.Root",
    );
  }
  return context;
}

/**
 * Hook to optionally access the MCP resource button context.
 * Returns null if used outside of McpResourceButton.Root.
 * @returns The MCP resource button context value or null
 */
export function useOptionalMcpResourceButtonContext(): McpResourceButtonContextValue | null {
  return React.useContext(McpResourceButtonContext);
}

export { McpResourceButtonContext };
