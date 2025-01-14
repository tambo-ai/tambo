import { ChatCompletionMessageParam, ChatCompletionTool } from "token.js";
import { OpenAIResponse } from "../../model/openai-response";

export interface LLMClient {
  complete(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    jsonMode?: boolean,
  ): Promise<OpenAIResponse>;
}
