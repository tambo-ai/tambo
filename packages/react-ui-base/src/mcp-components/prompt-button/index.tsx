"use client";

import { McpPromptButtonItem } from "./item/mcp-prompt-button-item";
import { McpPromptButtonList } from "./list/mcp-prompt-button-list";
import { McpPromptButtonMenu } from "./menu/mcp-prompt-button-menu";
import { McpPromptButtonRoot } from "./root/mcp-prompt-button-root";
import { McpPromptButtonTrigger } from "./trigger/mcp-prompt-button-trigger";

/**
 * McpPromptButton namespace containing all MCP prompt button base components.
 */
const McpPromptButton = {
  Root: McpPromptButtonRoot,
  Trigger: McpPromptButtonTrigger,
  Menu: McpPromptButtonMenu,
  List: McpPromptButtonList,
  Item: McpPromptButtonItem,
};

export type {
  McpPromptButtonItemProps,
  McpPromptButtonItemRenderProps,
} from "./item/mcp-prompt-button-item";
export type {
  McpPromptButtonListProps,
  McpPromptButtonListRenderProps,
} from "./list/mcp-prompt-button-list";
export type { McpPromptButtonMenuProps } from "./menu/mcp-prompt-button-menu";
export type {
  McpPromptButtonContextValue,
  McpPromptEntry,
  PromptMessage,
  PromptMessageContent,
} from "./root/mcp-prompt-button-context";
export {
  useMcpPromptButtonContext,
  useOptionalMcpPromptButtonContext,
} from "./root/mcp-prompt-button-context";
export type { McpPromptButtonRootProps } from "./root/mcp-prompt-button-root";
export type {
  McpPromptButtonTriggerProps,
  McpPromptButtonTriggerRenderProps,
} from "./trigger/mcp-prompt-button-trigger";
export { extractPromptText, isValidPromptData } from "./utils";

export { McpPromptButton };
