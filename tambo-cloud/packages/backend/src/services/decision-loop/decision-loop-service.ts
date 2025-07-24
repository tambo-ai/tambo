import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  ThreadMessage,
  ToolCallRequest,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { parse } from "partial-json";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { extractMessageContent } from "../../util/response-parsing";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import {
  getLLMResponseMessage,
  getLLMResponseToolCallId,
  getLLMResponseToolCallRequest,
  LLMClient,
  LLMResponse,
} from "../llm/llm-client";
import {
  addParametersToTools,
  displayMessageTool,
  filterOutStandardToolParameters,
  standardToolParameters,
  TamboToolParameters,
  UI_TOOLNAME_PREFIX,
} from "../tool/tool-service";

export async function* runDecisionLoop(
  llmClient: LLMClient,
  messages: ThreadMessage[],
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[],
  additionalContext: Record<string, any> | undefined,
  customInstructions: string | undefined,
  forceToolChoice?: string,
): AsyncIterableIterator<LegacyComponentDecision> {
  const componentTools = strictTools.filter((tool) =>
    tool.function.name.startsWith(UI_TOOLNAME_PREFIX),
  );
  // Add standard parameters to all tools
  const toolsWithStandardParameters = addParametersToTools(
    strictTools,
    standardToolParameters,
  );

  if (
    forceToolChoice &&
    !toolsWithStandardParameters.find(
      (tool) => tool.function.name === forceToolChoice,
    )
  ) {
    throw new Error(`Tool ${forceToolChoice} not found in provided tools`);
  }

  const { template: systemPrompt, args: systemPromptArgs } =
    generateDecisionLoopPrompt(customInstructions, additionalContext);
  const chatCompletionMessages =
    threadMessagesToChatCompletionMessageParam(messages);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);

  const responseStream = await llmClient.complete({
    messages: promptMessages,
    tools: toolsWithStandardParameters,
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatCompletionMessages,
      ...systemPromptArgs,
    },
    stream: true,
    tool_choice: forceToolChoice
      ? { type: "function", function: { name: forceToolChoice } }
      : "required",
  });

  const initialDecision: LegacyComponentDecision = {
    reasoning: "",
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

  for await (const chunk of responseStream) {
    try {
      const message = getLLMResponseMessage(chunk);
      const toolCall = chunk.message?.tool_calls?.[0];

      // Check if this is a UI tool call
      const isUITool =
        toolCall &&
        componentTools.some(
          (tool) => tool.function.name === toolCall.function.name,
        );

      let toolArgs: Partial<TamboToolParameters> = {};
      if (toolCall) {
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
      if (toolCall && Object.keys(toolArgs).length > 0) {
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

      // If this is a non-UI tool call, make sure params are complete and filter out standard tool parameters
      let clientToolRequest: ToolCallRequest | undefined;
      if (!isUITool && toolCall) {
        clientToolRequest = removeTamboToolParameters(
          toolCall,
          strictTools,
          chunk,
        );
      }

      const displayMessage = extractMessageContent(
        message.length > 0 ? message.trim() : paramDisplayMessage || " ",
        false,
      );

      const parsedChunk: Partial<LegacyComponentDecision> = {
        message: displayMessage,
        componentName: isUITool
          ? toolCall.function.name.slice(UI_TOOLNAME_PREFIX.length)
          : "",
        props: isUITool ? filteredToolArgs : null,
        toolCallRequest: clientToolRequest,
        toolCallId:
          toolCall?.function.name === displayMessageTool.function.name
            ? undefined
            : getLLMResponseToolCallId(chunk),
        statusMessage,
        completionStatusMessage,
      };

      accumulatedDecision = {
        ...accumulatedDecision,
        ...parsedChunk,
      };

      yield accumulatedDecision;
    } catch (e) {
      console.error("Error parsing stream chunk:", e);
    }
  }
}

function removeTamboToolParameters(
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  chunk: Partial<LLMResponse>,
) {
  const parsedToolCall = tryParseJsonObject(toolCall.function.arguments, false);
  if (parsedToolCall) {
    const filteredArgs = filterOutStandardToolParameters(
      toolCall,
      tools,
      parsedToolCall,
    );

    const originalRequest = getLLMResponseToolCallRequest(chunk);
    // Only include tool call request if it's not the displayMessageTool
    if (
      originalRequest &&
      filteredArgs &&
      toolCall.function.name !== displayMessageTool.function.name
    ) {
      return {
        ...originalRequest,
        parameters: filteredArgs,
      };
    }
  }
}
