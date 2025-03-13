import { formatTemplate } from "@libretto/openai/lib/src/template";
import {
  ChatCompletionMessageParam,
  StreamCompletionResponse,
  TokenJS,
} from "@libretto/token.js";
import { ToolCallRequest } from "@tambo-ai-cloud/core";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletion } from "openai/resources/chat/completions";
import { OpenAIResponse } from "../../model/openai-response";
import { Provider } from "../../model/providers";
import {
  CompleteParams,
  LLMClient,
  StreamingCompleteParams,
} from "./llm-client";

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
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<OpenAIResponse>>;
  async complete(params: CompleteParams): Promise<OpenAIResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<OpenAIResponse | AsyncIterableIterator<OpenAIResponse>> {
    const componentTools = params.tools?.length ? params.tools : undefined;

    const nonStringParams = Object.entries(params.promptTemplateParams).filter(
      ([, value]) =>
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
      params.messages as any,
      params.promptTemplateParams,
    );

    if (params.stream) {
      const stream = await this.client.chat.completions.create({
        provider: this.provider,
        model: this.model,
        messages: messagesFormatted,
        temperature: 0,
        response_format: extractResponseFormat(params),
        tools: componentTools,
        libretto: {
          promptTemplateName: params.promptTemplateName,
          templateParams: params.promptTemplateParams,
          templateChat: params.messages as any[],
          chainId: this.chainId,
        },
        stream: true,
      });

      return this.handleStreamingResponse(stream);
    }

    const response = await this.client.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: messagesFormatted,
      temperature: 0,
      response_format: extractResponseFormat(params),
      tools: componentTools,
      libretto: {
        promptTemplateName: params.promptTemplateName,
        templateParams: params.promptTemplateParams,
        templateChat: params.messages as any[],
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

  private async *handleStreamingResponse(
    stream: StreamCompletionResponse,
  ): AsyncIterableIterator<OpenAIResponse> {
    let accumulatedMessage = "";
    const accumulatedToolCall: { name?: string; arguments?: string } = {};

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0]?.function;

      if (content) {
        accumulatedMessage += content;
      }

      if (toolCall) {
        if (toolCall.name) {
          accumulatedToolCall.name = toolCall.name;
        }
        if (toolCall.arguments) {
          accumulatedToolCall.arguments =
            (accumulatedToolCall.arguments || "") + toolCall.arguments;
        }
      }

      let toolCallRequest: ToolCallRequest | undefined;
      if (accumulatedToolCall.name && accumulatedToolCall.arguments) {
        //don't return tool calls until they are complete
        try {
          const toolArgs = JSON.parse(accumulatedToolCall.arguments);
          toolCallRequest = {
            toolName: accumulatedToolCall.name,
            parameters: Object.entries(toolArgs).map(([key, value]) => ({
              parameterName: key,
              parameterValue: value,
            })),
          };
        } catch (_e) {
          // Skip if JSON parsing fails (incomplete JSON)
        }
      }

      yield { message: accumulatedMessage, toolCallRequest };
    }
  }

  private toolCallRequestFromResponse(response: ChatCompletion) {
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool calls found in response");
    }
    const toolArgs = JSON.parse(toolCall.function.arguments);

    return {
      toolName: toolCall.function.name,
      parameters: Object.entries(toolArgs).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  }
}

function extractResponseFormat(
  params: StreamingCompleteParams | CompleteParams,
) {
  if (params.jsonMode) {
    return { type: "json_object" };
  }

  if (params.zodResponseFormat) {
    const zodResponse = zodResponseFormat(
      params.zodResponseFormat,
      "response",
    ) as any;
    return zodResponse;
  }

  if (params.schemaResponseFormat) {
    return {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema: params.schemaResponseFormat,
      },
    };
  }

  return undefined;
}

/** We have to manually format this because objectTemplate doesn't seem to support chat_history */
function tryFormatTemplate(
  messages: ChatCompletionMessageParam[],
  promptTemplateParams: Record<string, any>,
) {
  try {
    return formatTemplate(messages as any, promptTemplateParams);
  } catch (_e) {
    return messages;
  }
}
