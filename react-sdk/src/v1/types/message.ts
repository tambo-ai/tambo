/**
 * Message and Content Types for v1 API
 *
 * Re-exports message and content types from `@tambo-ai/typescript-sdk`.
 * Messages use Anthropic-style content blocks pattern where a message
 * contains an array of content blocks (text, tool calls, tool results, components).
 */

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
 * Message role (from SDK)
 */
export type MessageRole = "user" | "assistant";

/**
 * Union type of all content block types
 */
export type Content =
  | TextContent
  | ToolUseContent
  | ToolResultContent
  | ComponentContent
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
