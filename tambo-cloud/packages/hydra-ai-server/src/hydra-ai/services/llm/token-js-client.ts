import { formatTemplate } from "@libretto/openai/lib/src/template";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  TokenJS,
} from "@libretto/token.js";
import { ChatCompletion } from "openai/resources/chat/completions";
import { OpenAIResponse } from "../../model/openai-response";
import { Provider } from "../../model/providers";
import { LLMClient } from "./llm-client";

export class TokenJSClient implements LLMClient {
  private client: TokenJS;

  constructor(
    private apiKey: string,
    private model: string,
    private provider: Provider,
    private chainId: string,
  ) {
    this.client = new TokenJS({ apiKey });
  }

  async complete(
    messages: ChatCompletionMessageParam[],
    promptTemplateName: string,
    promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>,
    tools?: ChatCompletionTool[],
    jsonMode: boolean = false,
  ): Promise<OpenAIResponse> {
    const componentTools = tools?.length ? tools : undefined;

    const nonStringParams = Object.entries(promptTemplateParams).filter(
      ([key, value]) =>
        typeof value !== "string" &&
        !Array.isArray(value) &&
        typeof value !== "undefined",
    );
    if (nonStringParams.length > 0) {
      console.trace(
        "All prompt template params must be strings, came from....",
        nonStringParams,
      );
    }
    const messagesFormatted = tryFormatTemplate(
      messages as any,
      promptTemplateParams,
    );
    const response = await this.client.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: messagesFormatted,
      temperature: 0,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      tools: componentTools,
      libretto: {
        promptTemplateName,
        templateParams: promptTemplateParams,
        templateChat: messages as any[],
        chainId: this.chainId,
      },
    });

    const openAIResponse: OpenAIResponse = {
      message: response.choices[0].message.content || "",
    };

    if (
      (response.choices[0].finish_reason === "function_call" ||
        response.choices[0].finish_reason === "tool_calls" ||
        response.choices[0].finish_reason === "stop") &&
      response.choices[0].message.tool_calls?.length
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

/** We have to manually format this because objectTemplate doesn't seem to support chat_history */
function tryFormatTemplate(
  messages: ChatCompletionMessageParam[],
  promptTemplateParams: Record<string, any>,
) {
  try {
    return formatTemplate(messages as any, promptTemplateParams);
  } catch (e) {
    return messages;
  }
}
