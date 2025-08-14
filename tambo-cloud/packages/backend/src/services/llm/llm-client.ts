import {
  ChatCompletionMessageParam,
  ToolCallRequest,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject, ZodRawShape } from "zod";

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
  messages: ChatCompletionMessageParam[];
  stream: true;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
  chainId?: string;
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
  chainId?: string;
}

export type CompleteParams = CompleteBaseParams & ResponseFormat;

export interface LLMClient {
  chainId: string;
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<Partial<LLMResponse>>>;

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

export type LLMResponse = Omit<LLMChatCompletionChoice, "finish_reason">;

/** Get the string response from the LLM response */
export function getLLMResponseMessage(response: Partial<LLMResponse>) {
  return response.message?.content ?? "";
}

/** Get the tool call id from the LLM response */
export function getLLMResponseToolCallId(response: Partial<LLMResponse>) {
  return response.message?.tool_calls?.[0]?.id;
}

/**
 * Get the tool call request from the LLM response, as a ToolCallRequest
 *
 * This is for backwards compatibility with the homegrown tool call format.
 */
export function getLLMResponseToolCallRequest(
  response: Partial<LLMResponse>,
): ToolCallRequest | undefined {
  const llmToolCall = response.message?.tool_calls?.[0];
  if (llmToolCall?.type !== "function") {
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
