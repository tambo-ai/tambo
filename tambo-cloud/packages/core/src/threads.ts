import type { OpenAI } from "openai";
import type { ComponentDecision } from "./ComponentDecision";

/**
 * Defines the possible roles for messages in a thread
 */
export enum MessageRole {
  User = "user",
  Assistant = "assistant",
  System = "system",
  Tool = "tool",
  Hydra = "hydra",
}

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

export type ChatCompletionContentPart =
  OpenAI.Chat.Completions.ChatCompletionContentPart;

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
  componentDecision?: ComponentDecision;
  /** Type of action performed */
  actionType?: ActionType;
  /** Additional metadata for the message */
  metadata?: Record<string, unknown>;
  /** Timestamp when the message was created */
  createdAt: Date;
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
