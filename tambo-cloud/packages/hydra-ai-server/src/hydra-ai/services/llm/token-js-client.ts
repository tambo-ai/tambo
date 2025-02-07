import { ChatCompletion } from "openai/resources/chat/completions";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  TokenJS,
} from "token.js";
import { OpenAIResponse } from "../../model/openai-response";
import { Provider } from "../../model/providers";
import { LLMClient } from "./llm-client";

export class TokenJSClient implements LLMClient {
  private client: TokenJS;

  constructor(
    private apiKey: string,
    private model: string,
    private provider: Provider,
  ) {
    this.client = new TokenJS({ apiKey });
  }

  async complete(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    jsonMode: boolean = false,
  ): Promise<OpenAIResponse> {
    const componentTools = tools?.length ? tools : undefined;

    const response = await this.client.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: messages,
      temperature: 0,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      tools: componentTools,
    });

    const openAIResponse: OpenAIResponse = {
      message: response.choices[0].message.content || "",
    };

    if (
      response.choices[0].finish_reason === "function_call" ||
      response.choices[0].finish_reason === "tool_calls"
    ) {
      openAIResponse.toolCallRequest = this.toolCallRequestFromResponse(
        response as ChatCompletion,
      );
    }
    if (!openAIResponse.message && !openAIResponse.toolCallRequest) {
      console.error(
        "No message or tool call request found in response: ",
        response.choices[0],
      );
    }

    return openAIResponse;
  }

  private toolCallRequestFromResponse(response: ChatCompletion) {
    if (!response.choices[0].message.tool_calls) {
      throw new Error("No tool calls found in response");
    }
    const toolArgs = JSON.parse(
      response.choices[0].message.tool_calls[0].function.arguments,
    );

    return {
      toolName: response.choices[0].message.tool_calls[0].function.name,
      parameters: Object.entries(toolArgs).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  }
}
