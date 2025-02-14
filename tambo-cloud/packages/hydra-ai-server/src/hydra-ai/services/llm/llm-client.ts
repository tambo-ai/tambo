import {
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
} from "@libretto/token.js";
import { OpenAIResponse } from "../../model/openai-response";

export interface LLMClient {
  complete(
    messages: ChatCompletionMessageParam[],
    promptTemplateName: string,
    promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>,
    tools?: ChatCompletionTool[],
    jsonMode?: boolean,
  ): Promise<OpenAIResponse>;
}
