"use client";

import { McpPromptsError } from "./error/mcp-prompts-error";
import { McpPromptsItem } from "./item/mcp-prompts-item";
import { McpPromptsList } from "./list/mcp-prompts-list";
import { McpPromptsRoot } from "./root/mcp-prompts-root";
import { McpPromptsTrigger } from "./trigger/mcp-prompts-trigger";

/**
 * McpPrompts namespace containing all MCP prompt picker base components.
 */
const McpPrompts = {
  Root: McpPromptsRoot,
  Trigger: McpPromptsTrigger,
  List: McpPromptsList,
  Item: McpPromptsItem,
  Error: McpPromptsError,
};

export type {
  McpPromptsContextValue,
  McpPromptsStatus,
} from "./root/mcp-prompts-context";
export type {
  McpPromptsErrorProps,
  McpPromptsErrorState,
} from "./error/mcp-prompts-error";
export type {
  McpPromptsItemProps,
  McpPromptsItemState,
} from "./item/mcp-prompts-item";
export type {
  McpPromptsListProps,
  McpPromptsListState,
} from "./list/mcp-prompts-list";
export type {
  McpPromptsRootProps,
  McpPromptsRootState,
} from "./root/mcp-prompts-root";
export type {
  McpPromptsTriggerProps,
  McpPromptsTriggerState,
} from "./trigger/mcp-prompts-trigger";

export type { useRender } from "@base-ui/react/use-render";

export { McpPrompts };
