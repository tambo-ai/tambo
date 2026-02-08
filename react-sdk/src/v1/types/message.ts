/**
 * Message and Content Types for v1 API
 *
 * Re-exports message and content types from `@tambo-ai/typescript-sdk`.
 * Messages use Anthropic-style content blocks pattern where a message
 * contains an array of content blocks (text, tool calls, tool results, components).
 */

import type { ReactElement } from "react";

// Re-export content block types from TypeScript SDK
// Note: ToolUseContent and ComponentContent are NOT re-exported - use V1ToolUseContent
// and V1ComponentContent instead, which include computed state properties.
export type {
  TextContent,
  ToolResultContent,
  ResourceContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

// Re-export message types from TypeScript SDK
import type { InputMessage } from "@tambo-ai/typescript-sdk/resources/threads/runs";
export type { InputMessage } from "@tambo-ai/typescript-sdk/resources/threads/runs";

/**
 * Widened InputMessage type for initial messages that supports system and assistant roles
 * in addition to the user role.
 *
 * The TS SDK `InputMessage` type constrains `role` to `'user'`, but the V1 API
 * accepts `'user' | 'system' | 'assistant'` for `initialMessages`. This type
 * widens the role field until the TS SDK type is regenerated.
 */
export type InitialInputMessage = Omit<InputMessage, "role"> & {
  role: "user" | "system" | "assistant";
};

export type {
  MessageListResponse,
  MessageGetResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/messages";

// Import for Content union type
import type {
  TextContent,
  ToolUseContent,
  ToolResultContent,
  ComponentContent,
  ResourceContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

/**
 * Streaming state for component content blocks.
 * Tracks the lifecycle of component prop/state streaming.
 */
export type ComponentStreamingState = "started" | "streaming" | "done";

/**
 * Extended ComponentContent with streaming state and rendered element.
 * Used by the v1 SDK to track component rendering lifecycle.
 */
export interface V1ComponentContent extends ComponentContent {
  /**
   * Current streaming state of this component's props.
   * - 'started': Component block created, awaiting props
   * - 'streaming': Props are being streamed
   * - 'done': Props streaming complete
   *
   * Optional for historical messages loaded from API (defaults to "done").
   */
  streamingState?: ComponentStreamingState;

  /**
   * The rendered React element for this component.
   * undefined if not yet rendered, null if the component couldn't be found in the registry.
   */
  renderedComponent?: ReactElement | null;
}

/**
 * Special display properties that can be included in tool input.
 * These are used to customize tool status messages shown in the UI.
 */
export interface TamboToolDisplayProps {
  /** Generic display message for the tool */
  _tambo_displayMessage?: string;
  /** Message shown while the tool is executing */
  _tambo_statusMessage?: string;
  /** Message shown after the tool completes */
  _tambo_completionStatusMessage?: string;
}

/**
 * Extended ToolUseContent with computed state properties.
 * Used by the v1 SDK to provide pre-computed tool state to consumers.
 *
 * Note: The computed properties are populated by `useTamboV1()` hook.
 * When accessed via lower-level APIs, they may be undefined.
 */
export interface V1ToolUseContent extends Omit<ToolUseContent, "input"> {
  /**
   * Tool input parameters with internal `_tambo_*` properties removed.
   * Consumers see only the actual tool parameters.
   */
  input: Record<string, unknown>;

  /**
   * Whether this tool call has completed (has a matching tool_result).
   * Computed by `useTamboV1()` based on presence of matching tool_result.
   */
  hasCompleted?: boolean;

  /**
   * The status message to display, resolved based on tool execution state.
   * Automatically updates as tool progresses through execution lifecycle.
   * Computed by `useTamboV1()`.
   */
  statusMessage?: string;

  /**
   * Extracted Tambo display properties from the tool input.
   * Consumers can use these for custom rendering if needed.
   * Computed by `useTamboV1()`.
   */
  tamboDisplayProps?: TamboToolDisplayProps;
}

/**
 * Message role (from SDK)
 * Includes 'system' to accommodate messages loaded from API.
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * Union type of all content block types.
 * Uses V1ComponentContent and V1ToolUseContent which include computed state.
 */
export type Content =
  | TextContent
  | V1ToolUseContent
  | ToolResultContent
  | V1ComponentContent
  | ResourceContent;

/**
 * Message in a thread (simplified from SDK's MessageGetResponse)
 */
export interface TamboV1Message {
  /** Unique message identifier */
  id: string;

  /** Message role (user or assistant) */
  role: MessageRole;

  /** Content blocks in the message */
  content: Content[];

  /** When the message was created (optional for historical messages loaded from API) */
  createdAt?: string;

  /** Message metadata */
  metadata?: Record<string, unknown>;

  /**
   * Reasoning content from the model (transient - only during streaming).
   * Each element is a reasoning "chunk" - models may emit multiple reasoning blocks.
   * This data is not persisted to the database and will not be present in
   * messages loaded from the API.
   */
  reasoning?: string[];

  /**
   * Duration of the reasoning phase in milliseconds (for display purposes).
   * Populated when reasoning completes.
   */
  reasoningDurationMS?: number;
}
