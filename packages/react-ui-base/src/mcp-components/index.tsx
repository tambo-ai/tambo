"use client";

export { McpPromptButton } from "./prompt-button";
export type {
  McpPromptButtonContextValue,
  McpPromptButtonItemProps,
  McpPromptButtonItemRenderProps,
  McpPromptButtonListProps,
  McpPromptButtonListRenderProps,
  McpPromptButtonMenuProps,
  McpPromptButtonRootProps,
  McpPromptButtonTriggerProps,
  McpPromptButtonTriggerRenderProps,
  McpPromptEntry,
  PromptMessage,
  PromptMessageContent,
} from "./prompt-button";
export {
  extractPromptText,
  isValidPromptData,
  useMcpPromptButtonContext,
  useOptionalMcpPromptButtonContext,
} from "./prompt-button";

export { McpResourceButton } from "./resource-button";
export type {
  McpResourceButtonContextValue,
  McpResourceButtonItemProps,
  McpResourceButtonItemRenderProps,
  McpResourceButtonListProps,
  McpResourceButtonListRenderProps,
  McpResourceButtonMenuProps,
  McpResourceButtonRootProps,
  McpResourceButtonSearchInputProps,
  McpResourceButtonSearchInputRenderProps,
  McpResourceButtonTriggerProps,
  McpResourceEntry,
} from "./resource-button";
export {
  useMcpResourceButtonContext,
  useOptionalMcpResourceButtonContext,
} from "./resource-button";
