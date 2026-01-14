import type { OpenAI } from "openai";
import type {
  ComponentDecisionV2,
  LegacyComponentDecision,
  ToolCallRequest,
} from "./ComponentDecision";
import { CombineUnion } from "./typeutils";

/**
 * Defines the possible roles for messages in a thread
 */
export enum MessageRole {
  User = "user",
  Assistant = "assistant",
  System = "system",
  /** A tool call response - generally from the user, often JSON */
  Tool = "tool",
}

export type OpenAIRole =
  | MessageRole.User
  | MessageRole.Assistant
  | MessageRole.System
  | MessageRole.Tool;

/**
 * Defines the types of actions that can occur in a thread
 * @deprecated - use the role and the presence of tool calls to determine the action type
 */
export enum ActionType {
  ToolCall = "tool_call",
  ToolResponse = "tool_response",
}

export enum ContentPartType {
  Text = "text",
  ImageUrl = "image_url",
  InputAudio = "input_audio",
  /**
   * Resource content part type - supports MCP Resources and other file types.
   * Can include URIs, text content, or base64-encoded blobs.
   */
  Resource = "resource",
}

/**
 * Re-export of OpenAI's chat completion content part type for text content.
 * We're re-exporting these but they are generic for whatever LLM you're using.
 *
 * Used for structured message content in thread messages
 */
export type ChatCompletionContentPartText =
  OpenAI.Chat.Completions.ChatCompletionContentPartText;
export type ChatCompletionContentRefusal =
  OpenAI.Chat.Completions.ChatCompletionContentPartRefusal;

export type ChatCompletionContentPartImage =
  OpenAI.Chat.Completions.ChatCompletionContentPartImage;

export type ChatCompletionContentPartInputAudio =
  OpenAI.Chat.Completions.ChatCompletionContentPartInputAudio;
export type ChatCompletionContentPartFile =
  OpenAI.Chat.Completions.ChatCompletionContentPart.File;

/**
 * MCP Resource-compatible content part.
 * Based on https://modelcontextprotocol.io/specification/2025-06-18/schema#resource
 *
 * Supports multiple content formats:
 * - URI/URL references (to be fetched and potentially stored in S3)
 * - Inline text content (may be stored in S3 for large content)
 * - Base64-encoded blob data (may be stored in S3 for large blobs)
 */
export interface ChatCompletionContentPartResource {
  type: ContentPartType.Resource;
  resource: Resource;
}

/**
 * Represents a single content part in a chat completion message
 * Can be text, image, audio, or resource
 *
 * Note: ChatCompletionContentPartResource is our custom extension for MCP resources
 * and should be converted to appropriate SDK-compatible types when passing to LLM providers.
 */
export type ChatCompletionContentPart =
  | OpenAI.Chat.Completions.ChatCompletionContentPart
  | ChatCompletionContentPartResource;

/**
 * A "static" type that combines all the content part types without any
 * discriminators, useful for expressing a serialized content part in a
 * type-safe way
 */
export type ChatCompletionContentPartUnion =
  CombineUnion<ChatCompletionContentPart>;

export type FunctionParameters = {
  [key: string]: unknown;
};

/**
 * Base properties shared by all thread messages
 */
interface BaseThreadMessage {
  /** Unique identifier for the message */
  id: string;
  /** ID of the thread this message belongs to */
  threadId: string;
  /**
   * The id of the parent message, if the message was created during the
   * generation of another message, such as during an agent call,
   * MCP Elicitation, or MCP Sample.
   */
  parentMessageId?: string;
  /** Component decision for this message */
  component?: LegacyComponentDecision;
  componentState?: Record<string, unknown>;
  /** Additional context for the message */
  additionalContext?: Record<string, unknown>;
  /** Error message for the message */
  error?: string;
  /** Additional metadata for the message */
  metadata?: Record<string, unknown>;
  /** Whether the message has been cancelled */
  isCancelled?: boolean;
  /** Timestamp when the message was created */
  createdAt: Date;
  /**
   * Type of action performed
   * @deprecated - use the role and the presence of tool calls to determine the action type
   */
  actionType?: ActionType;
}

/**
 * User message - content from the user
 */
export interface ThreadUserMessage extends BaseThreadMessage {
  role: MessageRole.User;
  content: ChatCompletionContentPart[];
  // User messages don't have tool calls
  tool_call_id?: never;
  toolCallRequest?: never;
  reasoning?: never;
  reasoningDurationMS?: never;
}

/**
 * System message - instructions for the AI
 */
export interface ThreadSystemMessage extends BaseThreadMessage {
  role: MessageRole.System;
  content: ChatCompletionContentPart[];
  // System messages don't have tool calls
  tool_call_id?: never;
  toolCallRequest?: never;
  reasoning?: never;
  reasoningDurationMS?: never;
}

/**
 * Assistant message - response from the AI
 * May include tool calls
 */
export interface ThreadAssistantMessage extends BaseThreadMessage {
  role: MessageRole.Assistant;
  content: ChatCompletionContentPart[];
  /** The tool call request for the message (if making a tool call) */
  toolCallRequest?: ToolCallRequest;
  /** Tool call ID (if this is part of a tool call flow) */
  tool_call_id?: string;
  /** Reasoning text from the LLM */
  reasoning?: string[];
  /** Duration of reasoning in milliseconds */
  reasoningDurationMS?: number;
}

/**
 * Tool message - result from a tool execution
 */
export interface ThreadToolMessage extends BaseThreadMessage {
  role: MessageRole.Tool;
  content: ChatCompletionContentPart[];
  /** REQUIRED: Tool call ID that this message responds to */
  tool_call_id: string;
  // Tool messages don't make tool calls themselves
  toolCallRequest?: never;
  reasoning?: never;
  reasoningDurationMS?: never;
}

/**
 * Discriminated union of all message types
 * TypeScript can narrow the type based on the role field
 */
export type ThreadMessage =
  | ThreadUserMessage
  | ThreadSystemMessage
  | ThreadAssistantMessage
  | ThreadToolMessage;

/**
 * Type guard to check if a message is a user message
 */
export function isUserMessage(msg: ThreadMessage): msg is ThreadUserMessage {
  return msg.role === MessageRole.User;
}

/**
 * Type guard to check if a message is an assistant message
 */
export function isAssistantMessage(
  msg: ThreadMessage,
): msg is ThreadAssistantMessage {
  return msg.role === MessageRole.Assistant;
}

/**
 * Type guard to check if a message is a system message
 */
export function isSystemMessage(
  msg: ThreadMessage,
): msg is ThreadSystemMessage {
  return msg.role === MessageRole.System;
}

/**
 * Type guard to check if a message is a tool message
 */
export function isToolMessage(msg: ThreadMessage): msg is ThreadToolMessage {
  return msg.role === MessageRole.Tool;
}

/**
 * Represents a thread message that has not yet been persisted to the database.
 * Used for in-memory message construction before saving.
 * The database is responsible for assigning id and threadId.
 */
export type UnsavedThreadUserMessage = Omit<
  ThreadUserMessage,
  "id" | "threadId" | "createdAt"
>;
export type UnsavedThreadSystemMessage = Omit<
  ThreadSystemMessage,
  "id" | "threadId" | "createdAt"
>;
export type UnsavedThreadAssistantMessage = Omit<
  ThreadAssistantMessage,
  "id" | "threadId" | "createdAt"
>;
export type UnsavedThreadToolMessage = Omit<
  ThreadToolMessage,
  "id" | "threadId" | "createdAt"
>;

export type UnsavedThreadMessage =
  | UnsavedThreadUserMessage
  | UnsavedThreadSystemMessage
  | UnsavedThreadAssistantMessage
  | UnsavedThreadToolMessage;

/** Temporary internal type to make sure that subclasses are aligned on types */
export interface InternalThreadMessage {
  role: MessageRole;
  content: ChatCompletionContentPartUnion[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2;
  /**
   * @deprecated - use the role and the presence of tool calls to determine the action type
   */
  actionType?: ActionType;
  toolCallRequest?: Partial<ToolCallRequest>;
  tool_call_id?: string;
  isCancelled?: boolean;
  reasoning?: string[];
  reasoningDurationMS?: number;
}

/**
 * Represents a conversation thread between a user and the assistant
 * Contains metadata and an array of messages
 */
export enum GenerationStage {
  IDLE = "IDLE",
  CHOOSING_COMPONENT = "CHOOSING_COMPONENT",
  FETCHING_CONTEXT = "FETCHING_CONTEXT",
  HYDRATING_COMPONENT = "HYDRATING_COMPONENT",
  STREAMING_RESPONSE = "STREAMING_RESPONSE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
}

/**
 * V1 Run Status - streaming status of the current run.
 *
 * This is a simple lifecycle aligned with AG-UI's run model:
 * - idle: No active SSE stream
 * - waiting: RUN_STARTED emitted, waiting for first content (TTFB phase)
 * - streaming: Actively receiving content
 *
 * Edge cases like cancellation, errors, and pending tool calls are tracked
 * via separate fields on Thread, not as status values.
 */
export enum V1RunStatus {
  /** No run is active */
  IDLE = "idle",
  /** RUN_STARTED emitted, waiting for first content */
  WAITING = "waiting",
  /** Actively receiving content */
  STREAMING = "streaming",
}

/**
 * V1 Run Error - error information from the last run.
 */
export interface V1RunError {
  /** Error code (e.g., "RATE_LIMIT_EXCEEDED", "INTERNAL_ERROR") */
  code?: string;
  /** Human-readable error message */
  message: string;
}

export interface Thread {
  /** Unique identifier for the thread */
  id: string;
  /** ID of the project this thread belongs to */
  projectId: string;
  /** Optional context key for thread organization/lookup */
  contextKey?: string;
  /** Additional metadata for the thread */
  metadata?: Record<string, unknown>;
  /** Current stage of the generation process */
  generationStage: GenerationStage;
  /** Timestamp when thread was created */
  createdAt: Date;
  /** Timestamp when thread was last updated */
  updatedAt: Date;

  // ==========================================
  // V1 API run lifecycle fields
  // ==========================================

  /** Status of the current run */
  runStatus?: V1RunStatus;
  /** ID of the currently active run, if any */
  currentRunId?: string;
  /** Human-readable status detail (e.g., "Fetching weather data...") */
  statusMessage?: string;

  /** Whether the last run was cancelled */
  lastRunCancelled?: boolean;
  /** Error information from the last run */
  lastRunError?: V1RunError;

  /** Tool call IDs awaiting client-side results */
  pendingToolCallIds?: string[];
  /** ID of the last completed run */
  lastCompletedRunId?: string;
}

export interface Resource {
  /** URI identifying the resource (e.g., file://, https://, s3://) */
  uri?: string;
  /** Human-readable name for the resource */
  name?: string;
  /** Optional description of the resource */
  description?: string;
  /** MIME type of the resource */
  mimeType?: string;
  /** Inline text content (alternative to uri) */
  text?: string;
  /** Base64-encoded blob data (alternative to uri or text) */
  blob?: string;
  /**
   * Annotations for additional metadata (MCP-specific).
   * Can include audience, priority, or custom properties.
   */
  annotations?: ResourceAnnotations;
}

/**
 * Annotations for resources (MCP-specific metadata).
 */
export interface ResourceAnnotations {
  /** Target audience for this resource */
  audience?: string[];
  /** Priority level for this resource */
  priority?: number;
  [key: string]: unknown;
}
