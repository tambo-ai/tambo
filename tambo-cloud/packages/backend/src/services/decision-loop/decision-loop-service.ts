import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  ThreadMessage,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import { parse } from "partial-json";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
} from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { SystemTools } from "../../systemTools";
import { extractMessageContent } from "../../util/response-parsing";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import {
  getLLMResponseMessage,
  getLLMResponseToolCallId,
  getLLMResponseToolCallRequest,
  LLMClient,
} from "../llm/llm-client";
import {
  addParametersToTools,
  convertComponentsToUITools,
  convertMetadataToTools,
  displayMessageTool,
  filterOutStandardToolParameters,
  standardToolParameters,
} from "../tool/tool-service";

export async function* runDecisionLoop(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  systemTools: SystemTools | undefined,
  clientTools: ComponentContextToolMetadata[],
  uiToolNamePrefix: string = "show_",
): AsyncIterableIterator<LegacyComponentDecision> {
  const componentTools = convertComponentsToUITools(
    availableComponents,
    uiToolNamePrefix,
  );
  const clientToolsConverted = convertMetadataToTools(clientTools);
  const contextTools = convertMetadataToTools(
    availableComponents.flatMap((component) => component.contextTools),
  );
  const tools = [
    ...componentTools,
    ...contextTools,
    ...clientToolsConverted,
    displayMessageTool,
    ...(systemTools?.tools ?? []),
  ];
  // Add standard parameters to all tools
  const toolsWithStandardParameters = addParametersToTools(
    tools,
    standardToolParameters,
  );

  const { template: systemPrompt } = generateDecisionLoopPrompt();
  const chatHistory = threadMessagesToChatHistory(messageHistory);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);

  const responseStream = await llmClient.complete({
    messages: promptMessages,
    tools: [...toolsWithStandardParameters, ...(systemTools?.tools ?? [])],
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
    stream: true,
    tool_choice: "required",
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
      const message = getLLMResponseMessage(chunk) || "";
      const toolCall = chunk.message?.tool_calls?.[0];

      // Check if this is a UI tool call
      const isUITool =
        toolCall &&
        componentTools.some(
          (tool) => tool.function.name === toolCall.function.name,
        );

      let toolArgs = {};
      if (toolCall) {
        try {
          //partial parse tool params to allow streaming in-progress params
          toolArgs = parse(toolCall.function.arguments);
        } catch (_e) {
          // Ignore parse errors for incomplete JSON
        }
      }

      const paramDisplayMessage = (toolArgs as any).displayMessage;
      const statusMessage = (toolArgs as any).statusMessage;
      const completionStatusMessage = (toolArgs as any).completionStatusMessage;
      // If this is a non-UI tool call, make sure params are complete and filter out standard tool parameters
      let filteredToolCallRequest;
      if (!isUITool && toolCall) {
        const parsedToolCall = tryParseJsonObject(
          toolCall.function.arguments,
          false,
        );
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
            filteredToolCallRequest = {
              ...originalRequest,
              parameters: filteredArgs,
            };
          }
        }
      }

      const displayMessage = extractMessageContent(
        message?.length > 0 ? message.trim() : paramDisplayMessage || " ",
        false,
      );

      const parsedChunk = {
        message: displayMessage,
        componentName: isUITool
          ? toolCall?.function.name.replace(uiToolNamePrefix, "")
          : "",
        props: isUITool ? toolArgs : null,
        toolCallRequest: filteredToolCallRequest,
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
