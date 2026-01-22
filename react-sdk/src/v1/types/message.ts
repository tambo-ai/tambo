/**
 * Message and Content Types for v1 API
 *
 * Re-exports message and content types from @tambo-ai/typescript-sdk.
 * Messages use Anthropic-style content blocks pattern where a message
 * contains an array of content blocks (text, tool calls, tool results, components).
 */

// Import and re-export content block types from TypeScript SDK
import type {
  TextContent as SDKTextContent,
  ToolUseContent as SDKToolUseContent,
  ToolResultContent as SDKToolResultContent,
  ComponentContent as SDKComponentContent,
  ResourceContent as SDKResourceContent,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

export type TextContent = SDKTextContent;
export type ToolUseContent = SDKToolUseContent;
export type ToolResultContent = SDKToolResultContent;
export type ComponentContent = SDKComponentContent;
export type ResourceContent = SDKResourceContent;

// Re-export message types from TypeScript SDK
export type { InputMessage } from "@tambo-ai/typescript-sdk/resources/threads/runs";

export type {
  MessageListResponse,
  MessageGetResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/messages";

/**
 * Message role (from SDK)
 */
export type MessageRole = "user" | "assistant";

/**
 * Union type of all content block types
 */
export type Content =
  | SDKTextContent
  | SDKToolUseContent
  | SDKToolResultContent
  | SDKComponentContent
  | SDKResourceContent;

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
