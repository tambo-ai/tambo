import { formatTemplate } from "@libretto/openai/lib/src/template";
import { StreamCompletionResponse, TokenJS } from "@libretto/token.js";
import {
  ChatCompletionMessageParam,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { Provider } from "../../model/providers";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
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
  ): Promise<AsyncIterableIterator<LLMResponse>>;
  async complete(params: CompleteParams): Promise<LLMResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<LLMResponse | AsyncIterableIterator<LLMResponse>> {
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
        tool_choice: params.tool_choice,
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
      tool_choice: params.tool_choice,
      tools: componentTools,
      libretto: {
        promptTemplateName: params.promptTemplateName,
        templateParams: params.promptTemplateParams,
        templateChat: params.messages as any[],
        chainId: this.chainId,
      },
    });

    if (!response.choices.length) {
      throw new Error("No choices returned from TokenJS");
    }
    return response.choices[0];
  }

  private async *handleStreamingResponse(
    stream: StreamCompletionResponse,
  ): AsyncIterableIterator<LLMResponse> {
    let accumulatedMessage = "";
    const accumulatedToolCall: {
      name?: string;
      arguments?: string;
      id?: string;
    } = {};

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
      const toolCallFunction = toolCall?.function;
      if (content) {
        accumulatedMessage += content;
      }

      if (toolCall) {
        if (toolCallFunction?.name) {
          accumulatedToolCall.name = toolCallFunction.name;
        }
        if (toolCall.id) {
          accumulatedToolCall.id = toolCall.id;
        }
        if (toolCallFunction?.arguments) {
          accumulatedToolCall.arguments =
            (accumulatedToolCall.arguments || "") + toolCallFunction.arguments;
        }
      }

      let toolCallRequest:
        | OpenAI.Chat.Completions.ChatCompletionMessageToolCall
        | undefined;
      if (accumulatedToolCall.name && accumulatedToolCall.arguments) {
        //don't return tool calls until they are complete and parseable
        const toolArgs = tryParseJsonObject(
          accumulatedToolCall.arguments,
          false,
        );
        if (toolArgs) {
          toolCallRequest = {
            function: {
              name: accumulatedToolCall.name,
              arguments: accumulatedToolCall.arguments,
            },
            id: accumulatedToolCall.id ?? "",
            type: "function",
          };
        }
      }

      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: toolCallRequest ? [toolCallRequest] : undefined,
        },
        index: 0,
        logprobs: null,
      };
    }
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
