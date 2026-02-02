/**
 * Message and Content Types for v1 API
 *
 * Re-exports message and content types from `@tambo-ai/typescript-sdk`.
 * Messages use Anthropic-style content blocks pattern where a message
 * contains an array of content blocks (text, tool calls, tool results, components).
 */

import type { ReactElement } from "react";

// Re-export content block types from TypeScript SDK
export type {
  TextContent,
  ToolUseContent,
  ToolResultContent,
  ComponentContent,
  ResourceContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

// Re-export message types from TypeScript SDK
export type { InputMessage } from "@tambo-ai/typescript-sdk/resources/threads/runs";

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
   */
  streamingState: ComponentStreamingState;

  /**
   * The rendered React element for this component.
   * undefined if not yet rendered, null if the component couldn't be found in the registry.
   */
  renderedComponent?: ReactElement | null;
}

/**
 * Message role (from SDK)
 */
export type MessageRole = "user" | "assistant";

/**
 * Union type of all content block types.
 * Uses V1ComponentContent which includes streaming state and rendered component.
 */
export type Content =
  | TextContent
  | ToolUseContent
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

  /** When the message was created */
  createdAt: string;

  /** Message metadata */
  metadata?: Record<string, unknown>;
}
