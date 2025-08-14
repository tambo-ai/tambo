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
 */
export enum ActionType {
  ToolCall = "tool_call",
  ToolResponse = "tool_response",
}

export enum ContentPartType {
  Text = "text",
  ImageUrl = "image_url",
  InputAudio = "input_audio",
  // TODO: we get back "resource" from MCP servers, but it is not supported yet
  // Resource = "resource",
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
 * Represents a single content part in a chat completion message
 * Can be a text, image, or audio
 */
export type ChatCompletionContentPart =
  OpenAI.Chat.Completions.ChatCompletionContentPart;

export type ChatCompletionMessageParam =
  OpenAI.Chat.Completions.ChatCompletionMessageParam;
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
  /** Array of content parts making up the message */
  content: ChatCompletionContentPart[];
  /** Component decision for this message */
  component?: LegacyComponentDecision;
  componentState?: Record<string, unknown>;
  /** Additional context for the message */
  additionalContext?: Record<string, any>;

  /** Type of action performed */
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
}

/** Temporary internal type to make sure that subclasses are aligned on types */
export interface InternalThreadMessage {
  role: MessageRole;
  content: ChatCompletionContentPartUnion[];
  metadata?: Record<string, unknown>;
  component?: ComponentDecisionV2;
  actionType?: ActionType;
  toolCallRequest?: Partial<ToolCallRequest>;
  tool_call_id?: string;
  isCancelled?: boolean;
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
