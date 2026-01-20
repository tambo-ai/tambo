import type { BaseEvent } from "@ag-ui/core";
import { ThreadMessage } from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject, ZodRawShape } from "zod/v3";

interface BaseResponseFormat {
  jsonMode?: boolean;
  zodResponseFormat?: ZodObject<ZodRawShape>;
  schemaResponseFormat?: JSONSchema;
}
interface JsonResponseFormat extends BaseResponseFormat {
  jsonMode: true;
}
interface ZodResponseFormat extends BaseResponseFormat {
  zodResponseFormat: ZodObject<ZodRawShape>;
}
interface SchemaResponseFormat extends BaseResponseFormat {
  schemaResponseFormat: JSONSchema;
}

type ResponseFormat =
  | {
      jsonMode?: never;
      zodResponseFormat?: never;
      schemaResponseFormat?: never;
    }
  | JsonResponseFormat
  | ZodResponseFormat
  | SchemaResponseFormat;

interface StreamingCompleteBaseParams {
  messages: ThreadMessage[];
  stream: true;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ThreadMessage[]>;
  chainId?: string;
}

export type StreamingCompleteParams = StreamingCompleteBaseParams &
  ResponseFormat;

interface CompleteBaseParams {
  messages: ThreadMessage[];
  stream?: false | undefined;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ThreadMessage[]>;
  chainId?: string;
}

export type CompleteParams = CompleteBaseParams & ResponseFormat;

export interface LLMClient {
  chainId: string;
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMStreamItem>>;
  complete(params: CompleteParams): Promise<LLMResponse>;
}

type LLMChatCompletionChoice = Omit<
  OpenAI.Chat.Completions.ChatCompletion.Choice,
  "finish_reason"
> & {
  finish_reason:
    | OpenAI.Chat.Completions.ChatCompletion.Choice["finish_reason"]
    | "unknown";
};

/** Additional fields that are not part of the ChatCompletionChoice, but we
 * still need to pass them back through to the caller */
interface LLMResponseExtras {
  /** Reasoning tokens from the LLM */
  reasoning?: string[];
  /** Duration of reasoning in milliseconds */
  reasoningDurationMS?: number;
}
export type LLMResponse = Omit<LLMChatCompletionChoice, "finish_reason"> &
  LLMResponseExtras;

/**
 * Extended stream item that includes both the LLM response and AG-UI events.
 * This allows consumers to either:
 * - Use the llmResponse for backwards-compatible behavior
 * - Use the aguiEvents for V1 API streaming
 */
export interface LLMStreamItem {
  /**
   * The traditional LLM response chunk (backwards compatible)
   */
  llmResponse: Partial<LLMResponse>;

  /**
   * AG-UI events generated from this streaming delta.
   * May contain 0-N events depending on the delta type.
   *
   * Events include:
   * - TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent
   * - ToolCallStartEvent, ToolCallArgsEvent, ToolCallEndEvent
   * - ThinkingTextMessageStartEvent, ThinkingTextMessageContentEvent, etc.
   */
  aguiEvents: BaseEvent[];
}

/** Get the string response from the LLM response */
export function getLLMResponseMessage(response: Partial<LLMResponse>) {
  return response.message?.content ?? "";
}

/** Get the tool call id from the LLM response */
export function getLLMResponseToolCallId(response: Partial<LLMResponse>) {
  return response.message?.tool_calls?.[0]?.id;
}

/**
 * Helper to get the LLM response from a stream item.
 * Use this when migrating from direct LLMResponse to LLMStreamItem.
 */
export function getStreamItemResponse(
  item: LLMStreamItem,
): Partial<LLMResponse> {
  return item.llmResponse;
}
