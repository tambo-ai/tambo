import { ChatCompletionChoice } from "@libretto/token.js";
import {
  ChatCompletionMessageParam,
  ToolCallRequest,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject } from "zod";

interface BaseResponseFormat {
  jsonMode?: boolean;
  zodResponseFormat?: ZodObject<any>;
  schemaResponseFormat?: JSONSchema;
}
interface JsonResponseFormat extends BaseResponseFormat {
  jsonMode: true;
}
interface ZodResponseFormat extends BaseResponseFormat {
  zodResponseFormat: ZodObject<any>;
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
  messages: ChatCompletionMessageParam[];
  stream: true;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type StreamingCompleteParams = StreamingCompleteBaseParams &
  ResponseFormat;

interface CompleteBaseParams {
  messages: ChatCompletionMessageParam[];
  stream?: false | undefined;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type CompleteParams = CompleteBaseParams & ResponseFormat;

export interface LLMClient {
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>>;

  complete(params: CompleteParams): Promise<LLMResponse>;
}
export type LLMResponse = Omit<ChatCompletionChoice, "finish_reason">;

/** Get the string response from the LLM response */
export function getLLMResponseMessage(response: LLMResponse) {
  return response.message?.content ?? "";
}

/** Get the tool call id from the LLM response */
export function getLLMResponseToolCallId(response: LLMResponse) {
  return response.message.tool_calls?.[0]?.id;
}

/**
 * Get the tool call request from the LLM response, as a ToolCallRequest
 *
 * This is for backwards compatibility with the homegrown tool call format.
 */
export function getLLMResponseToolCallRequest(
  response: LLMResponse,
): ToolCallRequest | undefined {
  const llmToolCall = response.message.tool_calls?.[0];
  if (!llmToolCall) {
    return undefined;
  }

  // TODO: should we throw here?
  const args = tryParseJsonObject(llmToolCall.function.arguments, false);
  if (!args) {
    console.error(
      `Failed to parse tool call arguments, is this an incomplete stream? ${llmToolCall.function.arguments}`,
    );
    return undefined;
  }
  const parameters = Object.entries(args).map(([key, value]) => ({
    parameterName: key,
    parameterValue: value,
  }));

  return {
    toolName: llmToolCall.function.name,
    parameters,
  };
}
