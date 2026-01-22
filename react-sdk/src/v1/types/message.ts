/**
 * Message and Content Types for v1 API
 *
 * Messages use Anthropic-style content blocks pattern where a message
 * contains an array of content blocks (text, tool calls, tool results, components).
 *
 * TODO: Once @tambo-ai/typescript-sdk/v1 is released, replace these with
 * imports from the SDK package.
 */

/**
 * Message role
 */
export type MessageRole = "user" | "assistant";

/**
 * Text content block
 */
export interface TextContent {
  type: "text";
  text: string;
}

/**
 * Tool use content block (tool invocation)
 */
export interface ToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block (tool execution result)
 */
export interface ToolResultContent {
  type: "tool_result";
  toolCallId: string;
  content: unknown;
  isError?: boolean;
}

/**
 * Component content block (AI-rendered React component)
 */
export interface ComponentContent {
  type: "component";
  id: string;
  name: string;
  props: Record<string, unknown>;
  state?: Record<string, unknown>;
}

/**
 * Union type of all content block types
 */
export type Content =
  | TextContent
  | ToolUseContent
  | ToolResultContent
  | ComponentContent;

/**
 * Message in a thread
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

/**
 * Message creation parameters
 */
export interface CreateMessageParams {
  /** Thread ID to add message to */
  threadId: string;

  /** Message role */
  role: MessageRole;

  /** Message content (simple text or content blocks) */
  content: string | Content[];

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
