import { EventType, type BaseEvent } from "@ag-ui/core";
import {
  ContentPartType,
  getToolName,
  isUiToolName,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
  UI_TOOLNAME_PREFIX,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { parse } from "partial-json";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import {
  prefetchAndCacheResources,
  ResourceFetcherMap,
} from "../../util/resource-transformation";
import { extractMessageContent } from "../../util/response-parsing";
import {
  getLLMResponseMessage,
  getLLMResponseToolCallId,
  LLMClient,
} from "../llm/llm-client";
import {
  addParametersToTools,
  filterOutStandardToolParameters,
  standardToolParameters,
  TamboToolParameters,
} from "../tool/tool-service";

/**
 * Compound type for decision loop output that includes both the traditional
 * LegacyComponentDecision (for backwards compatibility) and AG-UI events
 * (for V1 API streaming).
 */
export interface DecisionStreamItem {
  /**
   * The traditional component decision object containing message, component,
   * props, tool call info, and reasoning.
   */
  decision: LegacyComponentDecision;

  /**
   * AG-UI events generated from the current streaming delta.
   * May contain 0-N events depending on the delta type.
   */
  aguiEvents: BaseEvent[];
}

const TOOL_CHOICE_KEYWORDS = new Set(["auto", "required", "none"]);

/**
 * Converts a forceToolChoice string to the OpenAI tool_choice parameter format.
 *
 * Supports keyword values ("auto", "required", "none") which pass through
 * directly, and tool name strings which are wrapped in the function call format.
 * @param forceToolChoice - "auto", "required", "none", a tool name, or undefined
 * @returns OpenAI-compatible tool_choice value
 */
function convertToolChoice(
  forceToolChoice: string | undefined,
):
  | "auto"
  | "required"
  | "none"
  | { type: "function"; function: { name: string } } {
  if (!forceToolChoice || forceToolChoice === "auto") {
    return "auto";
  }
  if (forceToolChoice === "required" || forceToolChoice === "none") {
    return forceToolChoice;
  }
  return { type: "function", function: { name: forceToolChoice } };
}

/**
 * Run the decision loop for processing ThreadMessages and generating component
 * decisions.
 *
 * This function handles the core decision-making flow:
 * 1. Pre-fetches all MCP resources and caches them inline
 * 2. Filters tools into component tools (UI) and agent tools (actions)
 * 3. Adds standard parameters to all tools
 * 4. Formats messages using the decision loop prompt template
 * 5. Streams responses from the LLM client
 * 6. Parses streaming responses into LegacyComponentDecision objects
 * 7. Handles errors and malformed responses
 *
 * @param llmClient - The LLM client to use for generating responses
 * @param messages - Array of thread messages to process
 * @param strictTools - Array of available tools in OpenAI format
 * @param customInstructions - Optional custom instructions to add to the system
 *   prompt
 * @param forceToolChoice - Tool choice override: "auto", "required", "none",
 *   or a specific tool name
 * @param resourceFetchers - Map of serverKey to resource fetcher functions for
 *   fetching MCP resources
 * @returns Async iterator of component decisions
 */
export async function* runDecisionLoop(
  llmClient: LLMClient,
  messages: ThreadMessage[],
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[],
  customInstructions: string | undefined,
  forceToolChoice: string | undefined,
  resourceFetchers: ResourceFetcherMap,
  abortSignal?: AbortSignal,
): AsyncIterableIterator<DecisionStreamItem> {
  const componentTools = strictTools.filter((tool) =>
    isUiToolName(getToolName(tool)),
  );
  // Add standard parameters to all tools
  const toolsWithStandardParameters = addParametersToTools(
    strictTools,
    standardToolParameters,
  );

  if (
    forceToolChoice &&
    !TOOL_CHOICE_KEYWORDS.has(forceToolChoice) &&
    !toolsWithStandardParameters.find(
      (tool) => getToolName(tool) === forceToolChoice,
    )
  ) {
    throw new Error(`Tool ${forceToolChoice} not found in provided tools`);
  }

  const { template: systemPrompt, args: systemPromptArgs } =
    generateDecisionLoopPrompt(customInstructions);

  // Pre-fetch and cache all resources before sending to LLM
  const messagesWithCachedResources = await prefetchAndCacheResources(
    messages,
    resourceFetchers,
  );

  // Get threadId from messages - should always be present
  if (messages.length === 0) {
    throw new Error("Cannot run decision loop with no messages");
  }
  const threadId = messages[0].threadId;
  if (!threadId) {
    throw new Error("Cannot run decision loop: messages missing threadId");
  }

  // Build prompt messages: system message + chat history
  const systemMessage: ThreadMessage = {
    // This is a synthetic message id that is used to identify the system message -
    // we give it a synthetic id because it is not saved to the database.
    id: "synthetic-system-message-id",
    threadId,
    role: MessageRole.System,
    content: [{ type: ContentPartType.Text, text: systemPrompt }],
    createdAt: new Date(),
    componentState: {},
  };

  const promptMessages: ThreadMessage[] = [
    systemMessage,
    ...messagesWithCachedResources,
  ];

  const responseStream = await llmClient.complete({
    messages: promptMessages,
    tools: toolsWithStandardParameters,
    promptTemplateName: "decision-loop",
    promptTemplateParams: systemPromptArgs,
    stream: true,
    tool_choice: convertToolChoice(forceToolChoice),
    abortSignal,
  });

  const initialDecision: LegacyComponentDecision = {
    message: "",
    componentName: "",
    props: null,
    componentState: null,
    toolCallRequest: undefined,
    toolCallId: undefined,
    statusMessage: undefined,
    completionStatusMessage: undefined,
  };

  let accumulatedDecision = initialDecision;

  for await (const streamItem of responseStream) {
    try {
      const llmResponse = streamItem.llmResponse;
      const message = getLLMResponseMessage(llmResponse);
      const toolCall = llmResponse.message?.tool_calls?.[0];

      // Check if this is a UI tool call
      const isUITool =
        toolCall?.type === "function" &&
        componentTools.some(
          (tool) => getToolName(tool) === toolCall.function.name,
        );

      let toolArgs: Partial<TamboToolParameters> = {};
      if (toolCall?.type === "function") {
        try {
          //partial parse tool params to allow streaming in-progress params
          toolArgs = parse(toolCall.function.arguments);
        } catch (_e) {
          // Ignore parse errors for incomplete JSON
        }
      }
      const paramDisplayMessage = toolArgs._tambo_displayMessage;
      const statusMessage = toolArgs._tambo_statusMessage;
      const completionStatusMessage = toolArgs._tambo_completionStatusMessage;

      // Filter out Tambo parameters for both UI and non-UI tools
      let filteredToolArgs = toolArgs;
      if (toolCall?.type === "function" && Object.keys(toolArgs).length > 0) {
        const filtered = filterOutStandardToolParameters(
          toolCall,
          strictTools,
          toolArgs,
        ) as { parameterName: string; parameterValue: unknown }[];

        filteredToolArgs = filtered.reduce(
          (acc, { parameterName, parameterValue }) => ({
            ...acc,
            [parameterName]: parameterValue,
          }),
          {},
        ) as Partial<TamboToolParameters>;
      }

      // Build tool call request for both UI and non-UI tools (even if incomplete)
      let clientToolRequest: ToolCallRequest | undefined;
      if (toolCall) {
        clientToolRequest = buildToolCallRequest(toolCall, strictTools);
      }

      const displayMessage = extractMessageContent(
        message.length > 0 ? message.trim() : paramDisplayMessage || " ",
        false,
      );

      // Extract componentId from tambo.component.start event if present.
      // This ID is generated during streaming and used by V1 API for component
      // state updates. The start event is only emitted once (on the first delta),
      // so we preserve the accumulated componentId if we don't have a new one.
      const componentId = extractComponentIdFromEvents(streamItem.aguiEvents);

      const parsedChunk: Partial<LegacyComponentDecision> = {
        // For LLM responses, we can always assume the role is assistant
        role: MessageRole.Assistant,
        message: displayMessage,
        componentName: isUITool
          ? toolCall.function.name.slice(UI_TOOLNAME_PREFIX.length)
          : "",
        componentId: isUITool
          ? (componentId ?? accumulatedDecision.componentId)
          : undefined,
        props: isUITool ? filteredToolArgs : null,
        toolCallRequest: clientToolRequest,
        toolCallId: toolCall
          ? getLLMResponseToolCallId(llmResponse)
          : undefined,
        statusMessage,
        completionStatusMessage,
        reasoning: llmResponse.reasoning ?? undefined,
        reasoningDurationMS: llmResponse.reasoningDurationMS ?? undefined,
      };

      accumulatedDecision = {
        ...accumulatedDecision,
        ...parsedChunk,
      };

      yield {
        decision: accumulatedDecision,
        aguiEvents: streamItem.aguiEvents,
      };
    } catch (e) {
      console.error("Error parsing stream chunk:", e);
    }
  }
}

/**
 * Build a tool call request from a tool call, even if it's incomplete.
 * Returns undefined if the tool call is not a function type.
 * Uses partial-json parsing to handle incomplete JSON during streaming.
 */
function buildToolCallRequest(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
): ToolCallRequest | undefined {
  // "custom" tool calls are not supported
  if (toolCall.type !== "function") {
    console.warn(
      "Unsupported tool call type, only 'function' is supported, received: ",
      toolCall.type,
    );
    return undefined;
  }

  // Try to parse the arguments (may be incomplete during streaming)
  let parsedArgs: Record<string, unknown> | undefined;
  try {
    // Use partial-json parse to handle incomplete JSON during streaming
    parsedArgs = parse(toolCall.function.arguments);
  } catch (_e) {
    // If parsing fails completely, we can't build a request
    console.warn(
      "Failed to parse tool call arguments, received: ",
      toolCall.function.arguments,
    );
    return undefined;
  }
  if (
    !parsedArgs ||
    typeof parsedArgs !== "object" ||
    Array.isArray(parsedArgs)
  ) {
    console.warn("Invalid tool call arguments, received: ", parsedArgs);
    return undefined;
  }

  // Filter out standard Tambo parameters
  const filteredArgs = filterOutStandardToolParameters(
    toolCall,
    tools,
    parsedArgs,
  );

  if (!filteredArgs) {
    return undefined;
  }

  return {
    toolName: toolCall.function.name,
    parameters: filteredArgs,
  };
}

/**
 * Extract componentId from tambo.component.start event if present.
 *
 * The componentId is generated during streaming by ComponentStreamTracker
 * and emitted in tambo.component.start custom events. This ID is used by
 * V1 API to reference components for state updates.
 *
 * @param events - AG-UI events from the current stream item
 * @returns The componentId if a tambo.component.start event is present
 */
function extractComponentIdFromEvents(events: BaseEvent[]): string | undefined {
  for (const event of events) {
    if (event.type === EventType.CUSTOM) {
      const customEvent = event as BaseEvent & {
        name?: string;
        value?: { componentId?: string };
      };
      if (
        customEvent.name === "tambo.component.start" &&
        customEvent.value?.componentId
      ) {
        return customEvent.value.componentId;
      }
    }
  }
  return undefined;
}
