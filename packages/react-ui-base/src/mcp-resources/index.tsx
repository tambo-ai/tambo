"use client";

import { McpResourcesItem } from "./item/mcp-resources-item";
import { McpResourcesList } from "./list/mcp-resources-list";
import { McpResourcesRoot } from "./root/mcp-resources-root";
import { McpResourcesSearch } from "./search/mcp-resources-search";
import { McpResourcesTrigger } from "./trigger/mcp-resources-trigger";

/**
 * McpResources namespace containing all MCP resource picker base components.
 */
const McpResources = {
  Root: McpResourcesRoot,
  Trigger: McpResourcesTrigger,
  Search: McpResourcesSearch,
  List: McpResourcesList,
  Item: McpResourcesItem,
};

export type { McpResourcesContextValue } from "./root/mcp-resources-context";
export type {
  McpResourcesItemProps,
  McpResourcesItemState,
} from "./item/mcp-resources-item";
export type {
  McpResourcesListProps,
  McpResourcesListState,
} from "./list/mcp-resources-list";
export type {
  McpResourcesRootProps,
  McpResourcesRootState,
} from "./root/mcp-resources-root";
export type {
  McpResourcesSearchProps,
  McpResourcesSearchState,
} from "./search/mcp-resources-search";
export type {
  McpResourcesTriggerProps,
  McpResourcesTriggerState,
} from "./trigger/mcp-resources-trigger";

export { McpResources };
