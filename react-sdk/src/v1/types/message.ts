// Re-exported from @tambo-ai/client, with React-specific extension for TamboComponentContent
import type { ReactElement } from "react";
import type {
  TamboComponentContent as BaseTamboComponentContent,
  TextContent,
  TamboToolUseContent,
  ToolResultContent,
  ResourceContent,
} from "@tambo-ai/client";

export type {
  TextContent,
  ToolResultContent,
  ResourceContent,
  InputMessage,
  InitialInputMessage,
  MessageListResponse,
  MessageGetResponse,
  ComponentStreamingState,
  TamboToolDisplayProps,
  TamboToolUseContent,
  MessageRole,
  TamboThreadMessage,
} from "@tambo-ai/client";

/**
 * Extended ComponentContent with streaming state and rendered element.
 * Used by the React SDK to track component rendering lifecycle.
 *
 * Extends the base client TamboComponentContent with the React-specific
 * `renderedComponent` field.
 */
export interface TamboComponentContent extends BaseTamboComponentContent {
  /**
   * The rendered React element for this component.
   * undefined if not yet rendered, null if the component couldn't be found in the registry.
   */
  renderedComponent?: ReactElement | null;
}

/**
 * Union type of all content block types.
 * Uses React-specific TamboComponentContent which includes renderedComponent.
 */
export type Content =
  | TextContent
  | TamboToolUseContent
  | ToolResultContent
  | TamboComponentContent
  | ResourceContent;
