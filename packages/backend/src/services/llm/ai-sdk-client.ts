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
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { type LanguageModelV3 } from "@ai-sdk/provider";
import {
  CustomLlmParameters,
  getToolDescription,
  getToolName,
  llmProviderConfig,
  PARAMETER_METADATA,
  PROVIDER_SKILL_TOOL_NAMES,
  SKILL_TOOL_DISPLAY_NAME,
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
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type OpenAI from "openai";
import { z } from "zod/v3";
import { createLangfuseTelemetryConfig } from "../../config/langfuse.config";
import { Provider } from "../../model/providers";
import {
  ComponentStreamTracker,
  tryExtractComponentName,
} from "../../util/component-streaming";
import { formatTemplate, ObjectTemplate } from "../../util/template";
import { threadMessagesToModelMessages } from "../../util/thread-to-model-message-conversion";
import type { ProviderSkillConfig } from "@tambo-ai-cloud/core";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
  LLMStreamItem,
  StreamingCompleteParams,
} from "./llm-client";
import { generateMessageId } from "./message-id-generator";
import { limitTokens } from "./token-limiter";

type AICompleteParams = Parameters<typeof streamText<ToolSet, never>>[0] &
  Parameters<typeof generateText<ToolSet, never>>[0];
type TextStreamResponse = ReturnType<typeof streamText<ToolSet, never>>;

/**
 * Extract a skill name from raw provider tool arguments and return
 * sanitized JSON that shows activity without exposing internals.
 *
 * Provider args look like:
 *   { "type": "text_editor_code_execution", "path": "/skills/my-skill/SKILL.md", ... }
 *
 * The skill name is extracted from the path segment between /skills/ and /SKILL.md.
 * @returns The extracted skill name, or undefined if not found.
 */
export function extractSkillName(rawArgs: string): string | undefined {
  try {
    const parsed = JSON.parse(rawArgs) as Record<string, unknown>;
    const path = typeof parsed.path === "string" ? parsed.path : "";
    const match = path.match(/\/skills\/([^/]+)\//);
    return match?.[1];
  } catch {
    return undefined;
  }
}

/**
 * Build sanitized JSON args from accumulated skill names.
 * @returns JSON string like { "skills": ["skill-a", "skill-b"] } or "{}".
 */
export function buildSanitizedSkillArgs(skillNames: string[]): string {
  const unique = [...new Set(skillNames)];
  if (unique.length === 0) return "{}";
  return JSON.stringify({ skills: unique });
}

// Common provider configuration interface
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  providerName?: string;
}

// Model to provider mapping based on our config
function getProviderFromModel(model: string, provider: Provider): string {
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
       * Merge hierarchy (later overrides earlier):
       * 1. Provider-level defaults (e.g., parallelToolCalls)
       * 2. Model-level defaults (e.g., reasoningEffort for reasoning models)
       * 3. User-specified model-specific params (highest priority)
       */
      providerOptions: {
        [providerKey]: {
          // Provider-specific params from config as base defaults (e.g., disable parallel tool calls for OpenAI/Anthropic)
          ...providerCfg?.providerSpecificParams,
          // Model-level defaults for provider params (e.g., reasoningEffort: "none" for gpt-5.1)
          ...modelCfg?.modelParamsDefaults,
          // Model-specific provider parameters from user (e.g., reasoning parameters for specific models)
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

    // Merge provider-specific skills into config if present.
    // Model-level support is checked upstream in ensureProviderSkillsForRun,
    // so any skills passed here are valid for this model.
    const finalConfig = params.providerSkills?.skills.length
      ? this.mergeProviderSkills(baseConfig, params.providerSkills, providerKey)
      : baseConfig;

    if (params.stream) {
      // added explicit await even though types say it isn't necessary
      const result = await streamText({
        ...finalConfig,
        abortSignal: params.abortSignal,
      });
      return this.handleStreamingResponse(result);
    } else {
      const result = await generateText(finalConfig);
      return this.convertToLLMResponse(result);
    }
  }

  /**
   * Merge provider-specific skills into the AI SDK config.
   * For OpenAI: adds a shell tool with skillReference entries and switches to responses model.
   * For Anthropic: adds codeExecution tool and container.skills providerOptions.
   */
  private mergeProviderSkills(
    config: AICompleteParams,
    skillConfig: ProviderSkillConfig,
    providerKey: string,
  ): AICompleteParams {
    if (providerKey === "openai") {
      const openai = createOpenAI({ apiKey: this.apiKey });
      const shellTool = openai.tools.shell({
        environment: {
          type: "containerAuto",
          skills: skillConfig.skills.map((s) => ({
            type: "skillReference" as const,
            skillId: s.skillId,
            version: s.version,
          })),
        },
      });

      console.log(
        `[Skills] Switching OpenAI model to responses API for skills support (model: ${this.model})`,
      );

      if (config.tools && "shell" in config.tools) {
        console.warn(
          "[Skills] Overwriting existing 'shell' tool with skills shell tool",
        );
      }

      return {
        ...config,
        model: openai.responses(this.model),
        tools: {
          ...config.tools,
          shell: shellTool,
        },
      };
    }

    if (providerKey === "anthropic") {
      const anthropic = createAnthropic({ apiKey: this.apiKey });
      const codeExecutionTool = anthropic.tools.codeExecution_20260120();

      if (config.tools && "code_execution" in config.tools) {
        console.warn(
          "[Skills] Overwriting existing 'code_execution' tool with skills code execution tool",
        );
      }

      const existingAnthropicOptions =
        (config.providerOptions?.[providerKey] as Record<string, unknown>) ??
        {};

      return {
        ...config,
        tools: {
          ...config.tools,
          code_execution: codeExecutionTool,
        },
        providerOptions: {
          ...config.providerOptions,
          anthropic: {
            ...existingAnthropicOptions,
            container: {
              skills: skillConfig.skills.map((s) => ({
                type: "custom" as const,
                skillId: s.skillId,
                version: s.version,
              })),
            },
          },
        },
      };
    }

    return config;
  }

  private getModelInstance(providerKey: string): LanguageModelV3 {
    const config: ProviderConfig = {};

    if (this.apiKey) {
      config.apiKey = this.apiKey;
    }

    switch (providerKey) {
      case "openai":
        return createOpenAI(config)(this.model);
      case "anthropic":
        return createAnthropic(config)(this.model);
      case "mistral":
        return createMistral(config)(this.model);
      case "google":
        return createGoogleGenerativeAI(config)(this.model);
      case "groq":
        return createGroq(config)(this.model);
      case "openai-compatible": {
        if (this.provider === "cerebras") {
          config.baseURL = "https://api.cerebras.ai/v1";
          config.providerName = "cerebras";
        } else if (this.baseURL) {
          config.baseURL = this.baseURL;
        }
        return createOpenAICompatible({
          name: config.providerName || "openai-compatible",
          baseURL: config.baseURL || "",
          apiKey: config.apiKey,
        })(this.model);
      }
      default:
        throw new Error(`Unknown provider: ${providerKey}`);
    }
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
    let toolCallProviderOptionsById:
      | Record<string, ProviderOptions>
      | undefined;
    const accumulatedToolCall: {
      name?: string;
      arguments: string;
      id?: string;
    } = { arguments: "" };

    // Track message ID for AG-UI events
    let textMessageId: string | undefined;

    // Track component streaming for UI tools (show_component_*)
    let componentTracker: ComponentStreamTracker | undefined;

    // Track whether the current tool call is a provider skill tool.
    // Raw args are buffered separately so we can extract the skill name
    // without exposing internal provider details.
    let isProviderSkillTool = false;
    let skillToolRawArgs = "";
    // Accumulate skill names across multiple provider tool calls so all
    // invocations are captured in the single toolCallRequest per message.
    const accumulatedSkillNames: string[] = [];
    // Track whether the first skill TOOL_CALL_START has been emitted so
    // subsequent calls update args rather than creating new tool call events.
    let skillToolCallStarted = false;
    let skillToolCallId: string | undefined;

    for await (const delta of result.fullStream) {
      // Collect AG-UI events for this delta
      const aguiEvents: BaseEvent[] = [];

      switch (delta.type) {
        case "text-start":
          // If a skill tool call is open, close it now that text is starting
          if (skillToolCallStarted && skillToolCallId) {
            aguiEvents.push({
              type: EventType.TOOL_CALL_END,
              toolCallId: skillToolCallId,
              timestamp: Date.now(),
            } as ToolCallEndEvent);
            skillToolCallStarted = false;
            skillToolCallId = undefined;
          }
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
          // Replace provider skill tool names with a friendly display name
          isProviderSkillTool = PROVIDER_SKILL_TOOL_NAMES.has(delta.toolName);
          const displayToolName = isProviderSkillTool
            ? SKILL_TOOL_DISPLAY_NAME
            : delta.toolName;

          accumulatedToolCall.name = displayToolName;
          accumulatedToolCall.id = undefined;

          accumulatedToolCall.arguments = "";
          skillToolRawArgs = "";

          // Initialize component tracker for UI tools (show_component_* tools).
          // Component tools emit tambo.component.* custom events instead of
          // TOOL_CALL_* events - the tool mechanism is an internal detail.
          const componentName = tryExtractComponentName(delta.toolName);
          if (componentName) {
            // Generate a message ID for component events. The SDK will create
            // the message on-demand when it receives tambo.component.start.
            const componentMessageId = generateMessageId();
            const componentId = generateMessageId();
            componentTracker = new ComponentStreamTracker(
              componentMessageId,
              componentId,
              componentName,
            );
          } else if (isProviderSkillTool && skillToolCallStarted) {
            // Subsequent skill calls reuse the first TOOL_CALL_START so the
            // client sees one unified tool call, matching the refresh view.
            componentTracker = undefined;
          } else {
            componentTracker = undefined;
            // V1: emit TOOL_CALL_START immediately — delta.id is the toolCallId
            aguiEvents.push({
              type: EventType.TOOL_CALL_START,
              toolCallId: delta.id,
              toolCallName: displayToolName,
              parentMessageId: textMessageId,
              timestamp: Date.now(),
            } as ToolCallStartEvent);
            if (isProviderSkillTool) {
              skillToolCallStarted = true;
              skillToolCallId = delta.id;
            }
          }
          break;
        }
        case "tool-input-delta":
          // Emit component streaming events for UI tools
          if (componentTracker) {
            accumulatedToolCall.arguments += delta.delta;
            const componentEvents = componentTracker.processJsonDelta(
              delta.delta,
            );
            aguiEvents.push(...componentEvents);
          } else if (isProviderSkillTool) {
            // Buffer raw args silently - we'll extract the skill name at
            // tool-call time and emit sanitized args then.
            skillToolRawArgs += delta.delta;
          } else {
            accumulatedToolCall.arguments += delta.delta;
            // V1: emit TOOL_CALL_ARGS immediately — delta.id is the toolCallId
            aguiEvents.push({
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: delta.id,
              delta: delta.delta,
              timestamp: Date.now(),
            } as ToolCallArgsEvent);
          }
          break;
        case "tool-input-end":
          break;
        case "tool-call":
          if (delta.providerMetadata?.google?.thoughtSignature) {
            toolCallProviderOptionsById = {
              ...(toolCallProviderOptionsById ?? {}),
              [delta.toolCallId]: {
                google: {
                  thoughtSignature:
                    delta.providerMetadata.google.thoughtSignature,
                },
              },
            };
          }
          accumulatedToolCall.id = delta.toolCallId;
          if (componentTracker) {
            // Finalize component tracker and emit end event
            const endEvents = componentTracker.finalize();
            aguiEvents.push(...endEvents);
            componentTracker = undefined;
          } else if (accumulatedToolCall.name) {
            // For skill tools, extract the skill name from raw args and
            // emit sanitized args with all accumulated skill names.
            // Use the original toolCallId from the first START event so
            // the client sees one unified tool call across multiple provider calls.
            if (isProviderSkillTool) {
              const skillName = extractSkillName(skillToolRawArgs);
              if (skillName) {
                accumulatedSkillNames.push(skillName);
              }
              const sanitizedArgs = buildSanitizedSkillArgs(
                accumulatedSkillNames,
              );
              accumulatedToolCall.arguments = sanitizedArgs;
              const effectiveToolCallId = skillToolCallId ?? delta.toolCallId;
              aguiEvents.push({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: effectiveToolCallId,
                delta: sanitizedArgs,
                timestamp: Date.now(),
              } as ToolCallArgsEvent);
              // Don't emit TOOL_CALL_END for skill tools here - it will be
              // emitted when text streaming begins or when the stream ends,
              // so the client sees one continuous tool call.
            } else {
              // V1: only emit TOOL_CALL_END for non-skill tools
              aguiEvents.push({
                type: EventType.TOOL_CALL_END,
                toolCallId: delta.toolCallId,
                timestamp: Date.now(),
              } as ToolCallEndEvent);
            }
          }
          break;
        case "tool-result":
          // Provider-managed tools (e.g. OpenAI shell for skills) return results
          // inline in the stream. These are handled by the provider, not Tambo.
          if (!("providerExecuted" in delta) || !delta.providerExecuted) {
            throw new Error(
              "Tool result should not be emitted during streaming",
            );
          }
          // Keep the accumulated tool call data so it persists through
          // subsequent yields and gets stored in the database. The threads
          // service handles provider-managed tools by stripping them from
          // client responses while keeping them in DB for observability.
          break;
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
        case "tool-approval-request":
        case "tool-output-denied":
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
        toolCallProviderOptionsById,
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
    result: GenerateTextResult<Record<string, Tool>, never>,
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
  model: LanguageModelV3,
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
