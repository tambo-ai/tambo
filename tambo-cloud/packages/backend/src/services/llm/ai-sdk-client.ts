import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  ChatCompletionMessageParam,
  CustomLlmParameters,
  getToolDescription,
  getToolName,
  llmProviderConfig,
  PARAMETER_METADATA,
  tryParseJson,
  type LlmProviderConfigInfo,
} from "@tambo-ai-cloud/core";
import {
  convertToCoreMessages,
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  CoreUserMessage,
  generateText,
  jsonSchema,
  JSONValue,
  LanguageModel,
  streamText,
  Tool,
  tool,
  ToolCallPart,
  ToolChoice,
  ToolContent,
  ToolResultPart,
  type GenerateTextResult,
  type ToolSet,
} from "ai";
import type OpenAI from "openai";
import { UnreachableCaseError } from "ts-essentials";
import { z } from "zod";
import { createLangfuseTelemetryConfig } from "../../config/langfuse.config";
import { Provider } from "../../model/providers";
import { formatTemplate, ObjectTemplate } from "../../util/template";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
  StreamingCompleteParams,
} from "./llm-client";
import { limitTokens } from "./token-limiter";

type AICompleteParams = Parameters<typeof streamText<ToolSet, never>>[0] &
  Parameters<typeof generateText<ToolSet, never>>[0];
type TextStreamResponse = ReturnType<typeof streamText<ToolSet, never>>;

// Common provider configuration interface
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// Type for a configured provider instance that can create language models
type ConfiguredProvider = (modelId: string) => LanguageModel;

// Provider factory function type - creates configured provider instances
type ProviderFactory = (config?: ProviderConfig) => ConfiguredProvider;

// Provider instances mapping - these are factory functions
const PROVIDER_FACTORIES: Record<string, ProviderFactory> = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  mistral: createMistral,
  google: createGoogleGenerativeAI,
  groq: createGroq,
  "openai-compatible": (config) =>
    createOpenAICompatible({
      name: "openai-compatible",
      baseURL: config?.baseURL || "",
      apiKey: config?.apiKey,
      ...config,
    }),
} as const;

// Model to provider mapping based on our config
function getProviderFromModel(
  model: string,
  provider: Provider,
): keyof typeof PROVIDER_FACTORIES {
  // For openai-compatible, always use openai instance
  if (provider === "openai-compatible") {
    return "openai-compatible";
  }

  // For other providers, map based on the provider directly
  switch (provider) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "mistral":
      return "mistral";
    case "groq":
      return "groq";
    case "gemini":
      return "google";
    default:
      // Fallback to OpenAI for unknown providers
      return "openai";
  }
}

export class AISdkClient implements LLMClient {
  private model: string;
  private provider: Provider;
  private apiKey: string | undefined;
  private baseURL?: string;
  private maxInputTokens?: number | null;
  private customLlmParameters?: CustomLlmParameters;
  readonly chainId: string;
  readonly userId: string;

  constructor(
    apiKey: string | undefined,
    model: string,
    provider: Provider,
    chainId: string,
    userId: string,
    baseURL?: string,
    maxInputTokens?: number | null,
    customLlmParameters?: CustomLlmParameters,
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.provider = provider;
    this.chainId = chainId;
    this.userId = userId;
    this.baseURL = baseURL;
    this.maxInputTokens = maxInputTokens;
    this.customLlmParameters = customLlmParameters;
  }

  async complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>>;
  async complete(params: CompleteParams): Promise<LLMResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<LLMResponse | AsyncIterableIterator<LLMResponse>> {
    const providerKey = getProviderFromModel(this.model, this.provider);

    // Get the model instance with proper configuration
    const modelInstance = this.getModelInstance(providerKey);

    // Format messages using the same template system as token.js client
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

    let messagesFormatted = tryFormatTemplate(
      params.messages,
      params.promptTemplateParams,
    );

    // Apply token limiting
    const providerCfg = (
      llmProviderConfig as Partial<Record<Provider, LlmProviderConfigInfo>>
    )[this.provider];

    const models = providerCfg?.models;
    const modelCfg = models ? models[this.model] : undefined;

    if (!modelCfg) {
      console.warn(
        `Unknown model "${this.model}" for provider "${this.provider}"`,
      );
    }

    const modelTokenLimit = modelCfg?.inputTokenLimit;
    const effectiveTokenLimit = this.maxInputTokens ?? modelTokenLimit;
    messagesFormatted = limitTokens(messagesFormatted, effectiveTokenLimit);

    // Prepare tools
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    // Prepare response format
    const responseFormat = this.extractResponseFormat(params);

    // Convert to AI SDK format
    const coreMessages = messagesFormatted.map(
      (message, index): CoreMessage =>
        convertOpenAIMessageToCoreMessage(
          message,
          messagesFormatted.slice(0, index),
        ),
    );

    // Prepare experimental telemetry for Langfuse
    const experimentalTelemetry = createLangfuseTelemetryConfig({
      sessionId: params.chainId ?? this.chainId,
      provider: this.provider,
      model: this.model,
      functionId: `${this.provider}-${this.model}`,
    });

    // Extract custom parameters for the current model
    const allCustomParams =
      this.customLlmParameters?.[providerKey]?.[this.model];

    // For openai-compatible provider, split parameters between suggestions and custom keys
    let customParams = allCustomParams;
    let providerSpecificCustomParams = {} as Record<string, JSONValue>;

    if (providerKey === "openai-compatible" && allCustomParams) {
      const suggestionKeys = Object.keys(PARAMETER_METADATA);

      // Split parameters: suggestions go to customParams, custom keys go to providerOptions
      customParams = {};
      providerSpecificCustomParams = {};

      Object.entries(allCustomParams).forEach(([key, value]) => {
        if (suggestionKeys.includes(key)) {
          customParams![key] = value;
        } else {
          providerSpecificCustomParams[key] = value;
        }
      });
    }

    // Get model-specific defaults (e.g., temperature: 1 for models that need it)
    const modelDefaults = modelCfg?.commonParametersDefaults || {};

    const baseConfig: AICompleteParams = {
      model: modelInstance,
      messages: coreMessages,
      tools,
      toolChoice: params.tool_choice
        ? this.convertToolChoice(params.tool_choice)
        : undefined,
      ...(responseFormat && { responseFormat }),
      ...(experimentalTelemetry && {
        experimental_telemetry: experimentalTelemetry,
      }),
      /**
       * Provider-specific configuration
       */
      providerOptions: {
        [providerKey]: {
          // Provider-specific params from config as base defaults (e.g., disable parallel tool calls for OpenAI/Anthropic)
          ...providerCfg?.providerSpecificParams,
          // For openai-compatible, add custom user-defined keys here
          ...(providerKey === "openai-compatible" &&
            providerSpecificCustomParams),
        },
      },
      /**
       * Apply parameter hierarchy:
       * 1. Model-specific defaults
       * 2. Custom user parameters (highest priority)
       */
      ...modelDefaults, // Model-specific defaults (e.g., temperature: 1)
      ...(customParams || {}), // Custom parameters override all
    };

    if (params.stream) {
      // added explicit await even though types say it isn't necessary
      const result = await streamText(baseConfig);
      return this.handleStreamingResponse(result);
    } else {
      const result = await generateText(baseConfig);
      return this.convertToLLMResponse(result);
    }
  }

  private getModelInstance(providerKey: string): LanguageModel {
    const config: ProviderConfig = {};

    if (this.apiKey) {
      config.apiKey = this.apiKey;
    }

    if (providerKey === "openai-compatible" && this.baseURL) {
      config.baseURL = this.baseURL;
    }

    // Create the configured provider instance
    const providerFactory = PROVIDER_FACTORIES[providerKey];
    const configuredProvider = providerFactory(config);

    // Now call the configured provider with the model ID
    return configuredProvider(this.model);
  }

  private convertTools(tools: OpenAI.Chat.Completions.ChatCompletionTool[]) {
    const toolSet: ToolSet = {};

    tools.forEach((toolDef) => {
      const toolName = getToolName(toolDef);
      // Create a simplified tool definition compatible with AI SDK
      // We'll use a simple z.any() for parameters since converting JSON Schema to Zod is complex
      const inputSchema: any =
        toolDef.type === "function"
          ? jsonSchema(toolDef.function.parameters ?? {})
          : z.any();
      const aiSdkTool: Tool = tool<any>({
        type: "function",
        description: getToolDescription(toolDef) || "",
        inputSchema: inputSchema,
      });

      toolSet[toolName] = aiSdkTool;
    });

    return toolSet;
  }

  /**
   * Convert the tool choice to a format that the AI SDK can understand.
   * @param toolChoice - The tool choice to convert.
   * @returns The converted tool choice.
   */
  private convertToolChoice(
    toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption,
  ): ToolChoice<ToolSet> {
    if (typeof toolChoice === "string") {
      return toolChoice;
    }
    switch (toolChoice.type) {
      case "function":
        return {
          type: "tool" as const,
          toolName: toolChoice.function.name,
        };
      case "custom":
        return {
          type: "tool" as const,
          toolName: toolChoice.custom.name,
        };
      case "allowed_tools":
        return "auto";
      default:
        return toolChoice;
    }
  }

  private extractResponseFormat(
    params: StreamingCompleteParams | CompleteParams,
  ) {
    if (params.jsonMode) {
      return { type: "json" as const };
    }

    if (params.zodResponseFormat) {
      return {
        type: "object" as const,
        schema: params.zodResponseFormat,
      };
    }

    if (params.schemaResponseFormat) {
      return {
        type: "object" as const,
        schema: params.schemaResponseFormat,
      };
    }

    return undefined;
  }

  private async *handleStreamingResponse(
    result: TextStreamResponse,
  ): AsyncIterableIterator<LLMResponse> {
    let accumulatedMessage = "";
    let accumulatedReasoning: string[] = [];
    const accumulatedToolCall: {
      name?: string;
      arguments: string;
      id?: string;
    } = { arguments: "" };

    for await (const delta of result.fullStream) {
      switch (delta.type) {
        case "text-start":
          accumulatedMessage = "";
          break;
        case "text-delta":
          accumulatedMessage += delta.text;
          break;
        case "text-end":
          break;
        case "tool-input-start":
          accumulatedToolCall.name = delta.toolName;
          break;
        case "tool-input-delta":
          accumulatedToolCall.arguments += delta.delta;
          break;
        case "tool-input-end":
          break;
        case "tool-call":
          accumulatedToolCall.id = delta.toolCallId;
          break;
        case "tool-result":
          // Tambo should be handling all tool results, not operating like an agent
          throw new Error("Tool result should not be emitted during streaming");
        case "tool-error":
          console.error("Got error from tool call", delta.error);
          break;
        case "reasoning-start":
          // append to the last element of the array
          accumulatedReasoning = [...accumulatedReasoning, ""];
          break;
        case "reasoning-delta":
          accumulatedReasoning = [
            ...accumulatedReasoning.slice(0, -1),
            accumulatedReasoning[accumulatedReasoning.length - 1] + delta.text,
          ];
          break;
        case "reasoning-end":
          break;
        case "source": // url? not sure what this is
        case "file": // TODO: handle files - should be added as message objects
        case "start": // start of streaming
        case "finish": // completion is done, no more streaming
        case "start-step": // for capturing round-trips when behaving like an agent
        case "finish-step": // for capturing round-trips when behaving like an agent
        case "raw":
          // Fine to ignore these, but we put them in here to make sure we don't
          // miss any new additions to the streamText API
          break;
        case "error":
          console.error("error:", delta.error);
          throw delta.error;
          // Mostly ignored/unsupported
          break;
        case "abort":
          throw new Error("Aborted by SDK");
        default:
          warnUnknownMessageType(delta);
      }
      let toolCallRequest:
        | OpenAI.Chat.Completions.ChatCompletionMessageToolCall
        | undefined;
      if (accumulatedToolCall.name && accumulatedToolCall.arguments) {
        toolCallRequest = {
          function: {
            name: accumulatedToolCall.name,
            arguments: accumulatedToolCall.arguments,
          },
          id: accumulatedToolCall.id ?? "",
          type: "function",
        };
      }

      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: toolCallRequest ? [toolCallRequest] : undefined,
          refusal: null,
        },
        reasoning: accumulatedReasoning,
        index: 0,
        logprobs: null,
      };
    }

    // If we were not streaming tool calls, this is how we would handle the
    // tool calls at the end of the stream.

    // const toolCalls = await result.toolCalls;
    // if (toolCalls.length) {
    //   console.log(
    //     `found ${toolCalls.length} tool calls!`,
    //     toolCalls[0].toolName,
    //     toolCalls[0].args,
    //   );
    //   yield {
    //     message: {
    //       content: accumulatedMessage,
    //       role: "assistant",
    //       tool_calls: toolCalls.map(
    //         (call): OpenAI.Chat.Completions.ChatCompletionMessageToolCall => ({
    //           function: {
    //             arguments: JSON.stringify(call.args),
    //             name: call.toolName,
    //           },
    //           id: call.toolCallId,
    //           type: "function",
    //         }),
    //       ),
    //       refusal: null,
    //     },
    //     index: 0,
    //     logprobs: null,
    //   };
    // }
  }

  private convertToLLMResponse(
    result: GenerateTextResult<Record<string, Tool>, undefined>,
  ): LLMResponse {
    const toolCalls = result.toolCalls.map((call) => ({
      function: {
        name: call.toolName,
        // TOOD: is this correct? is call.input actually an object?
        arguments: JSON.stringify(call.input),
      },
      id: call.toolCallId,
      type: "function" as const,
    }));

    return {
      message: {
        content: result.text,
        role: "assistant",
        tool_calls: toolCalls,
        refusal: null,
      },
      index: 0,
      logprobs: null,
    };
  }
}

/** We have to manually format this because objectTemplate doesn't seem to support chat_history */
function tryFormatTemplate(
  messages: ChatCompletionMessageParam[],
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>,
): ChatCompletionMessageParam[] {
  try {
    return formatTemplate(
      messages as ObjectTemplate<ChatCompletionMessageParam[]>,
      promptTemplateParams,
    );
  } catch (_e) {
    return messages;
  }
}

function findToolNameById(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolCallId: string,
): string | undefined {
  const toolNames = messages
    .map((message) => {
      if (message.role === "assistant" && message.tool_calls) {
        const toolCall = message.tool_calls.find(
          (call) => call.id === toolCallId,
        );
        return toolCall ? getToolName(toolCall) : undefined;
      }
    })
    .filter((name) => name !== undefined);
  return toolNames.length > 0 ? toolNames[0] : undefined;
}

/**
 * This is effectively the same thing as as singular version of
 * convertToCoreMessages, (which is supposedly deprecated anyway)
 * but for some reason that function doesn't deal with tool calls.
 */
function convertOpenAIMessageToCoreMessage(
  message: OpenAI.Chat.Completions.ChatCompletionMessageParam,
  previousMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): CoreMessage {
  if (message.role === "developer" || message.role === "function") {
    throw new Error("Developer messages are not supported");
  }
  if (message.role === "tool") {
    const toolName = findToolNameById(previousMessages, message.tool_call_id);
    if (!toolName) {
      throw new Error(
        `Unable to find previous message for tool call ${message.tool_call_id}`,
      );
    }
    return {
      role: "tool",
      content:
        typeof message.content === "string"
          ? ([
              {
                output: {
                  type: "text",
                  value: message.content,
                },
                toolCallId: message.tool_call_id,
                type: "tool-result",
                toolName: toolName,
              } satisfies ToolResultPart,
            ] satisfies ToolContent)
          : message.content.map(
              (part): ToolResultPart => ({
                // TODO: Figure out multi-tool + multi-content results - is
                // there one content per tool call?
                type: "tool-result",
                output: {
                  type: "text",
                  value: part.text,
                },
                toolCallId: message.tool_call_id,
                toolName: toolName,
              }),
            ),
    } satisfies CoreToolMessage;
  }
  if (message.role === "assistant" && message.tool_calls) {
    const content: (ToolCallPart | { type: "text"; text: string })[] = [];

    // Add text content if it exists
    if (message.content) {
      if (typeof message.content === "string") {
        content.push({ type: "text", text: message.content });
      } else if (Array.isArray(message.content)) {
        message.content.forEach((part) => {
          switch (part.type) {
            case "text":
              content.push({ type: "text", text: part.text });
              break;
            case "refusal":
              // Handle refusal content
              content.push({
                type: "text",
                text: `[Refusal]: ${part.refusal}`,
              });
              break;
            default:
              // This should never happen - unreachable case
              console.error(
                `Unexpected content type in assistant message: `,
                part,
              );
              throw new UnreachableCaseError(part);
          }
        });
      }
    }

    // Add tool calls
    message.tool_calls.forEach((call) => {
      content.push({
        type: "tool-call",
        input:
          call.type === "function"
            ? tryParseJson(call.function.arguments)
            : call.custom.input,
        toolCallId: call.id,
        toolName: getToolName(call),
      } satisfies ToolCallPart);
    });

    return {
      role: "assistant",
      content: content,
    } satisfies CoreAssistantMessage;
  }
  if (message.role === "user") {
    if (typeof message.content === "string") {
      return {
        role: "user",
        content: message.content,
      } satisfies CoreUserMessage;
    } else if (Array.isArray(message.content)) {
      const processedContent = message.content
        .map((part) => {
          if (part.type === "text") {
            return {
              type: "text" as const,
              text: part.text,
            };
          } else if (part.type === "image_url" && part.image_url.url) {
            // Convert image_url to AI SDK's expected image format
            return {
              type: "image" as const,
              image: part.image_url.url,
            };
          }
          return null;
        })
        .filter((part) => part !== null);

      return {
        role: message.role,
        content: processedContent,
      } satisfies CoreUserMessage;
    }
    console.error(
      "Unexpected content type in user message:",
      typeof message.content,
    );
    throw new UnreachableCaseError(message.content);
  }
  return convertToCoreMessages([
    {
      role: message.role,
      parts:
        typeof message.content === "string"
          ? [{ type: "text", text: message.content }]
          : // this a hack but it works
            (message.content?.map((part) => part as any) ?? []),
    },
  ])[0];
}

function warnUnknownMessageType(message: never) {
  console.warn("Unknown message type:", message);
}
