"use client";

import { McpResourceButtonItem } from "./item/mcp-resource-button-item";
import { McpResourceButtonList } from "./list/mcp-resource-button-list";
import { McpResourceButtonMenu } from "./menu/mcp-resource-button-menu";
import { McpResourceButtonRoot } from "./root/mcp-resource-button-root";
import { McpResourceButtonSearchInput } from "./search-input/mcp-resource-button-search-input";
import { McpResourceButtonTrigger } from "./trigger/mcp-resource-button-trigger";

/**
 * McpResourceButton namespace containing all MCP resource button base components.
 */
const McpResourceButton = {
  Root: McpResourceButtonRoot,
  Trigger: McpResourceButtonTrigger,
  Menu: McpResourceButtonMenu,
  SearchInput: McpResourceButtonSearchInput,
  List: McpResourceButtonList,
  Item: McpResourceButtonItem,
};

export type {
  McpResourceButtonItemProps,
  McpResourceButtonItemRenderProps,
} from "./item/mcp-resource-button-item";
export type {
  McpResourceButtonListProps,
  McpResourceButtonListRenderProps,
} from "./list/mcp-resource-button-list";
export type { McpResourceButtonMenuProps } from "./menu/mcp-resource-button-menu";
export type {
  McpResourceButtonContextValue,
  McpResourceEntry,
} from "./root/mcp-resource-button-context";
export {
  useMcpResourceButtonContext,
  useOptionalMcpResourceButtonContext,
} from "./root/mcp-resource-button-context";
export type { McpResourceButtonRootProps } from "./root/mcp-resource-button-root";
export type {
  McpResourceButtonSearchInputProps,
  McpResourceButtonSearchInputRenderProps,
} from "./search-input/mcp-resource-button-search-input";
export type { McpResourceButtonTriggerProps } from "./trigger/mcp-resource-button-trigger";

export { McpResourceButton };
