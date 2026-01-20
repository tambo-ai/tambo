import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModelV2 } from "@ai-sdk/provider";
import {
  EventType,
  type BaseEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
  type TextMessageStartEvent,
  type ThinkingTextMessageContentEvent,
  type ThinkingTextMessageEndEvent,
  type ThinkingTextMessageStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallStartEvent,
} from "@ag-ui/core";
import {
  CustomLlmParameters,
  getToolDescription,
  getToolName,
  llmProviderConfig,
  PARAMETER_METADATA,
  ThreadMessage,
  type LlmProviderConfigInfo,
} from "@tambo-ai-cloud/core";
import {
  generateText,
  jsonSchema,
  JSONValue,
  streamText,
  Tool,
  tool,
  ToolChoice,
  type GenerateTextResult,
  type ToolSet,
} from "ai";
import type OpenAI from "openai";
import { z } from "zod/v3";
import { createLangfuseTelemetryConfig } from "../../config/langfuse.config";
import { Provider } from "../../model/providers";
import { formatTemplate, ObjectTemplate } from "../../util/template";
import { threadMessagesToModelMessages } from "../../util/thread-to-model-message-conversion";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
  LLMStreamItem,
  StreamingCompleteParams,
} from "./llm-client";
import { generateMessageId } from "./message-id-generator";
import { limitTokens } from "./token-limiter";
import {
  ComponentStreamTracker,
  tryExtractComponentName,
} from "../../util/component-streaming";

type AICompleteParams = Parameters<typeof streamText<ToolSet, never>>[0] &
  Parameters<typeof generateText<ToolSet, never>>[0];
type TextStreamResponse = ReturnType<typeof streamText<ToolSet, never>>;

// Common provider configuration interface
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  providerName?: string;
  [key: string]: unknown;
}

// Type for a configured provider instance that can create language models
type ConfiguredProvider = (modelId: string) => LanguageModelV2;

// Provider factory function type - creates configured provider instances
type ProviderFactory = (config?: ProviderConfig) => ConfiguredProvider;

// Provider instances mapping - these are factory functions
const PROVIDER_FACTORIES: Record<string, ProviderFactory> = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  mistral: createMistral,
  google: createGoogleGenerativeAI,
  groq: createGroq,
  // Cerebras uses openai-compatible provider with custom base URL (see getModelInstance)
  "openai-compatible": (config) =>
    createOpenAICompatible({
      name: config?.providerName || "openai-compatible",
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
    case "cerebras":
      // Cerebras uses openai-compatible provider with custom base URL
      return "openai-compatible";
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
  ): Promise<AsyncIterableIterator<LLMStreamItem>>;
  async complete(params: CompleteParams): Promise<LLMResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<LLMResponse | AsyncIterableIterator<LLMStreamItem>> {
    const providerKey = getProviderFromModel(this.model, this.provider);

    // Get the model instance with proper configuration
    const modelInstance = this.getModelInstance(providerKey);
    const isSupportedMimeType =
      await getSupportedMimeTypePredicate(modelInstance);

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

    // Get model configuration for token limiting and other params
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

    // Apply token limiting
    const modelTokenLimit = modelCfg?.inputTokenLimit;
    const effectiveTokenLimit = this.maxInputTokens ?? modelTokenLimit;
    messagesFormatted = limitTokens(messagesFormatted, effectiveTokenLimit);

    // Prepare tools
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    // Prepare response format
    const responseFormat = this.extractResponseFormat(params);

    // Convert to AI SDK format using new direct conversion
    const modelMessages = threadMessagesToModelMessages(
      messagesFormatted,
      isSupportedMimeType,
    );

    // Prepare experimental telemetry for Langfuse
    const experimentalTelemetry = createLangfuseTelemetryConfig({
      sessionId: params.chainId ?? this.chainId,
      provider: this.provider,
      model: this.model,
      functionId: `${this.provider}-${this.model}`,
    });

    // Extract custom parameters for the current model
    // Handle provider key mapping (e.g., "gemini" provider stores under "gemini" but AI SDK uses "google")
    const originalProviderKey = this.provider; // e.g., "gemini"
    const mappedProviderKey = providerKey; // e.g., "google"

    const allCustomParams =
      this.customLlmParameters?.[mappedProviderKey]?.[this.model] ||
      this.customLlmParameters?.[originalProviderKey]?.[this.model];

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

    // Separate model-specific provider parameters from regular custom parameters
    // Model-specific params (e.g., reasoningEffort for OpenAI) must go under providerOptions[providerKey]
    // Regular params (e.g., temperature, top_p) go at the top level
    const modelSpecificParamKeys = new Set(
      Object.keys(modelCfg?.modelSpecificParams || {}),
    );
    const modelSpecificProviderParams: Record<string, JSONValue> = {};
    const filteredCustomParams: Record<string, JSONValue> = {};

    if (customParams) {
      Object.entries(customParams).forEach(([key, value]) => {
        if (modelSpecificParamKeys.has(key)) {
          // This parameter is model-specific and should go under providerOptions
          modelSpecificProviderParams[key] = value;
        } else {
          // This parameter is a standard parameter and goes at top level
          filteredCustomParams[key] = value;
        }
      });
    }

    const baseConfig: AICompleteParams = {
      model: modelInstance,
      messages: modelMessages,
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
          // Model-specific provider parameters (e.g., reasoning parameters for specific models)
          ...modelSpecificProviderParams,
          // For openai-compatible, add custom user-defined keys here
          ...(providerKey === "openai-compatible" &&
            providerSpecificCustomParams),
        },
      },
      /**
       * Apply parameter hierarchy:
       * 1. Model-specific defaults
       * 2. Custom user parameters (highest priority, excluding model-specific provider params)
       */
      ...modelDefaults, // Model-specific defaults (e.g., temperature: 1)
      ...filteredCustomParams, // Custom parameters override all, but exclude model-specific provider params
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

  private getModelInstance(providerKey: string): LanguageModelV2 {
    const config: ProviderConfig = {};

    if (this.apiKey) {
      config.apiKey = this.apiKey;
    }

    // Handle openai-compatible providers (including Cerebras)
    if (providerKey === "openai-compatible") {
      if (this.provider === "cerebras") {
        // Cerebras uses openai-compatible with their API endpoint
        config.baseURL = "https://api.cerebras.ai/v1";
        config.providerName = "cerebras";
      } else if (this.baseURL) {
        config.baseURL = this.baseURL;
      }
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
  ): AsyncIterableIterator<LLMStreamItem> {
    let accumulatedMessage = "";
    let accumulatedReasoning: string[] = [];
    let reasoningStartTimestamp: number | undefined;
    let reasoningEndTimestamp: number | undefined;
    const accumulatedToolCall: {
      name?: string;
      arguments: string;
      id?: string;
    } = { arguments: "" };

    // Track message ID for AG-UI events
    let textMessageId: string | undefined;
    // Local mutable accumulator for tool call args deltas (reset per tool call);
    // do not reuse outside this scope.
    let toolCallArgDeltas: string[] = [];

    // Track component streaming for UI tools (show_component_*)
    let componentTracker: ComponentStreamTracker | undefined;

    for await (const delta of result.fullStream) {
      // Collect AG-UI events for this delta
      const aguiEvents: BaseEvent[] = [];

      switch (delta.type) {
        case "text-start":
          accumulatedMessage = "";
          // Generate message ID for this text stream
          textMessageId = generateMessageId();
          aguiEvents.push({
            type: EventType.TEXT_MESSAGE_START,
            messageId: textMessageId,
            role: "assistant",
            timestamp: Date.now(),
          } as TextMessageStartEvent);
          break;
        case "text-delta":
          accumulatedMessage += delta.text;
          if (textMessageId) {
            aguiEvents.push({
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: textMessageId,
              delta: delta.text,
              timestamp: Date.now(),
            } as TextMessageContentEvent);
          }
          break;
        case "text-end":
          if (textMessageId) {
            aguiEvents.push({
              type: EventType.TEXT_MESSAGE_END,
              messageId: textMessageId,
              timestamp: Date.now(),
            } as TextMessageEndEvent);
          }
          break;
        case "tool-input-start": {
          accumulatedToolCall.name = delta.toolName;
          accumulatedToolCall.arguments = "";
          accumulatedToolCall.id = undefined;
          toolCallArgDeltas = [];

          // Initialize component tracker for UI tools
          // Component streaming is only emitted for valid `show_component_*` tool names.
          const componentName = tryExtractComponentName(delta.toolName);
          if (componentName) {
            const componentId = generateMessageId();
            componentTracker = new ComponentStreamTracker(
              componentId,
              componentName,
            );
          } else {
            componentTracker = undefined;
          }
          break;
        }
        case "tool-input-delta":
          accumulatedToolCall.arguments += delta.delta;
          toolCallArgDeltas.push(delta.delta);

          // Emit component streaming events for UI tools
          if (componentTracker) {
            const componentEvents = componentTracker.processJsonDelta(
              delta.delta,
            );
            aguiEvents.push(...componentEvents);
          }
          break;
        case "tool-input-end":
          break;
        case "tool-call":
          accumulatedToolCall.id = delta.toolCallId;
          if (accumulatedToolCall.name) {
            aguiEvents.push({
              type: EventType.TOOL_CALL_START,
              toolCallId: delta.toolCallId,
              toolCallName: accumulatedToolCall.name,
              parentMessageId: textMessageId,
              timestamp: Date.now(),
            } as ToolCallStartEvent);

            for (const toolCallArgDelta of toolCallArgDeltas) {
              aguiEvents.push({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: delta.toolCallId,
                delta: toolCallArgDelta,
                timestamp: Date.now(),
              } as ToolCallArgsEvent);
            }

            aguiEvents.push({
              type: EventType.TOOL_CALL_END,
              toolCallId: delta.toolCallId,
              timestamp: Date.now(),
            } as ToolCallEndEvent);

            // Finalize component tracker and emit end event
            if (componentTracker) {
              const endEvents = componentTracker.finalize();
              aguiEvents.push(...endEvents);
              componentTracker = undefined;
            }
          }

          toolCallArgDeltas = [];
          break;
        case "tool-result":
          // Tambo should be handling all tool results, not operating like an agent
          throw new Error("Tool result should not be emitted during streaming");
        case "tool-error":
          throw delta.error;
        case "reasoning-start":
          // append to the last element of the array
          accumulatedReasoning = [...accumulatedReasoning, ""];
          reasoningStartTimestamp = reasoningStartTimestamp ?? Date.now();
          aguiEvents.push({
            type: EventType.THINKING_TEXT_MESSAGE_START,
            timestamp: Date.now(),
          } as ThinkingTextMessageStartEvent);
          break;
        case "reasoning-delta":
          accumulatedReasoning = [
            ...accumulatedReasoning.slice(0, -1),
            accumulatedReasoning[accumulatedReasoning.length - 1] + delta.text,
          ];
          aguiEvents.push({
            type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
            delta: delta.text,
            timestamp: Date.now(),
          } as ThinkingTextMessageContentEvent);
          break;
        case "reasoning-end":
          reasoningEndTimestamp = Date.now();
          aguiEvents.push({
            type: EventType.THINKING_TEXT_MESSAGE_END,
            timestamp: Date.now(),
          } as ThinkingTextMessageEndEvent);
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
        case "abort":
          throw new Error("Aborted by SDK");
        default:
          warnUnknownMessageType(delta);
      }

      let toolCallRequest:
        | OpenAI.Chat.Completions.ChatCompletionMessageToolCall
        | undefined;
      if (
        accumulatedToolCall.id &&
        accumulatedToolCall.name &&
        accumulatedToolCall.arguments
      ) {
        toolCallRequest = {
          function: {
            name: accumulatedToolCall.name,
            arguments: accumulatedToolCall.arguments,
          },
          id: accumulatedToolCall.id,
          type: "function",
        };
      }

      yield {
        llmResponse: {
          message: {
            content: accumulatedMessage,
            role: "assistant",
            tool_calls: toolCallRequest ? [toolCallRequest] : undefined,
            refusal: null,
          },
          reasoning: accumulatedReasoning,
          reasoningDurationMS:
            reasoningStartTimestamp && reasoningEndTimestamp
              ? reasoningEndTimestamp - reasoningStartTimestamp
              : undefined,
          index: 0,
          logprobs: null,
        },
        aguiEvents,
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
  messages: ThreadMessage[],
  promptTemplateParams: Record<string, string | ThreadMessage[]>,
): ThreadMessage[] {
  try {
    return formatTemplate(
      messages as ObjectTemplate<ThreadMessage[]>,
      promptTemplateParams,
    );
  } catch (_e) {
    return messages;
  }
}

function warnUnknownMessageType(message: never) {
  console.warn("Unknown message type:", message);
}

/**
 * Get a predicate function to check if a model supports a given MIME type.
 * Exported for testing purposes.
 */
export async function getSupportedMimeTypePredicate(
  model: LanguageModelV2,
): Promise<(mimeType: string) => boolean> {
  const supportedUrls = await model.supportedUrls;
  const mimeTypePatterns = Object.keys(supportedUrls);
  return (mimeType: string) => {
    return mimeTypePatterns.some((pattern) => {
      // Handle '*' wildcard
      if (pattern === "*") {
        return true;
      }
      // Handle 'image/*' wildcard
      if (pattern.endsWith("*")) {
        return mimeType.startsWith(pattern.slice(0, -1));
      }
      // Handle exact match
      return mimeType === pattern;
    });
  };
}
