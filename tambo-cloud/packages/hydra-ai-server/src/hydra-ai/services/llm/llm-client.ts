import {
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
} from "@libretto/token.js";
import { OpenAIResponse } from "../../model/openai-response";

export interface LLMClient {
  complete(params: {
    messages: ChatCompletionMessageParam[];
    stream: true;
    tools?: ChatCompletionTool[];
    promptTemplateName: string;
    promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
    jsonMode?: boolean;
  }): Promise<AsyncIterableIterator<OpenAIResponse>>;

  complete(params: {
    messages: ChatCompletionMessageParam[];
    stream?: false | undefined;
    tools?: ChatCompletionTool[];
    promptTemplateName: string;
    promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
    jsonMode?: boolean;
  }): Promise<OpenAIResponse>;
}
