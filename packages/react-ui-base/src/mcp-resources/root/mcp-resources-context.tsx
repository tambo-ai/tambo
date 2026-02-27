import type { ListResourceEntry } from "@tambo-ai/react/mcp";
import * as React from "react";

export interface McpResourcesContextValue {
  resources: ListResourceEntry[];
  isLoading: boolean;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  onSelectResource: (uri: string, label: string) => void;
}

export const McpResourcesContext =
  React.createContext<McpResourcesContextValue | null>(null);

/**
 * Hook to access the MCP resources context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The MCP resources context value
 * @throws Error if used outside of McpResources.Root
 */
export function useMcpResourcesContext(): McpResourcesContextValue {
  const context = React.useContext(McpResourcesContext);
  if (!context) {
    throw new Error(
      "React UI Base: McpResourcesContext is missing. McpResources parts must be used within <McpResources.Root>",
    );
  }
  return context;
}
