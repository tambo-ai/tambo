import {
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
} from "@libretto/token.js";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject } from "zod";
import { OpenAIResponse } from "../../model/openai-response";

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
  tools?: ChatCompletionTool[];
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type StreamingCompleteParams = StreamingCompleteBaseParams &
  ResponseFormat;

interface CompleteBaseParams {
  messages: ChatCompletionMessageParam[];
  stream?: false | undefined;
  tools?: ChatCompletionTool[];
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type CompleteParams = CompleteBaseParams & ResponseFormat;

export interface LLMClient {
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<OpenAIResponse>>;

  complete(params: CompleteParams): Promise<OpenAIResponse>;
}
