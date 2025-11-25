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
  /**
   * Hydra is a new role that is used to represent a message from the Hydra assistant.
   * It is used to represent a message from the Hydra assistant.
   * @deprecated
   */
  Hydra = "hydra",
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

export type ChatCompletionUserMessageParam =
  OpenAI.Chat.Completions.ChatCompletionUserMessageParam & {
    content: ChatCompletionContentPart[] | string;
  };
export type ChatCompletionSystemMessageParam =
  OpenAI.Chat.Completions.ChatCompletionSystemMessageParam;
export type ChatCompletionToolMessageParam =
  OpenAI.Chat.Completions.ChatCompletionToolMessageParam;
export type ChatCompletionAssistantMessageParam =
  OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam;
export type ChatCompletionDeveloperMessageParam =
  OpenAI.Chat.Completions.ChatCompletionDeveloperMessageParam;

/** @deprecated so not exporting this type */
type ChatCompletionFunctionMessageParam =
  OpenAI.Chat.Completions.ChatCompletionFunctionMessageParam;
export type ChatCompletionMessageParam =
  | ChatCompletionUserMessageParam
  | ChatCompletionSystemMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam
  | ChatCompletionDeveloperMessageParam
  | ChatCompletionFunctionMessageParam;
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
 * Represents a single message within a thread
 * Can be from a user, assistant, or system
 */
export interface ThreadMessage {
  /** Unique identifier for the message */
  id: string;
  /** ID of the thread this message belongs to */
  threadId: string;
  /** The role of who sent the message */
  role: MessageRole;
  /**
   * The id of the parent message, if the message was created during the
   * generation of another message, such as during an agent call,
   * MCP Elicitation, or MCP Sample.
   */
  parentMessageId?: string;
  /** Array of content parts making up the message */
  content: ChatCompletionContentPart[];
  /** Component decision for this message */
  component?: LegacyComponentDecision;
  componentState?: Record<string, unknown>;
  /** Additional context for the message */
  additionalContext?: Record<string, unknown>;

  /**
   * Type of action performed
   * @deprecated - use the role and the presence of tool calls to determine the action type
   */
  actionType?: ActionType;

  /** Error message for the message */
  error?: string;

  /** Additional metadata for the message */
  metadata?: Record<string, unknown>;
  /** Whether the message has been cancelled */
  isCancelled?: boolean;
  /** Timestamp when the message was created */
  createdAt: Date;

  /** Used only when role === "tool" */
  tool_call_id?: string;
  /**
   * The tool call request for the message
   */
  toolCallRequest?: ToolCallRequest;
  /** Reasoning text from the LLM */
  reasoning?: string[];
  /** Duration of reasoning in milliseconds */
  reasoningDurationMS?: number;
}

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
  /** Message to display describing the current stage of the generation process */
  statusMessage?: string;
  /** Timestamp when thread was created */
  createdAt: Date;
  /** Timestamp when thread was last updated */
  updatedAt: Date;
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
