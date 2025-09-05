import { Message } from "@ag-ui/core";
import {
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import { AgentClient } from "../llm/agent-client";

export async function* runAgentLoop(
  agentClient: AgentClient,
  messages: ThreadMessage[],
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[],
  //   customInstructions: string | undefined,
): AsyncIterableIterator<LegacyComponentDecision> {
  const chatCompletionMessages =
    threadMessagesToChatCompletionMessageParam(messages);
  // const systemPromptArgs = customInstructions
  //     ? { custom_instructions: customInstructions }
  //     : {};

  const stream = agentClient.streamRunAgent({
    messages: chatCompletionMessages,
    tools: strictTools,
    // promptTemplateName: "decision-loop",
    // promptTemplateParams: {
    //   chat_history: chatCompletionMessages,
    //   ...systemPromptArgs,
    // },
  });
  for await (const event of stream) {
    const { message } = event;
    const toolCallId = getToolCallId(message);
    const toolCallRequest = getToolCallRequest(message);
    yield {
      id: message.id,
      role: message.role as MessageRole,
      message: message.content || "",
      componentName: null,
      props: null,
      componentState: null,
      reasoning: "",
      statusMessage: "",
      completionStatusMessage: "",
      toolCallRequest: toolCallRequest,
      toolCallId: toolCallId,
    };
  }
}
function getToolCallId(message: Message) {
  if (message.role === "assistant") {
    return message.toolCalls?.[0]?.id;
  }
  if (message.role === "tool") {
    return message.toolCallId;
  }
  return undefined;
}

function getToolCallRequest(message: Message): ToolCallRequest | undefined {
  if (message.role !== "assistant" || !message.toolCalls?.length) {
    return;
  }
  const toolCall = message.toolCalls[0];
  try {
    const parameters: Record<string, unknown> = JSON.parse(
      toolCall.function.arguments ? toolCall.function.arguments : "{}",
    );
    return {
      toolName: toolCall.function.name,
      parameters: Object.entries(parameters).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  } catch (e) {
    console.warn(
      `Error parsing tool call arguments for tool '${toolCall.function.name}'`,
      e,
      toolCall.function.arguments,
    );
    return;
  }
}
