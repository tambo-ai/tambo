import { Message } from "@ag-ui/core";
import {
  AsyncQueue,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import {
  prefetchAndCacheResources,
  ResourceFetcherMap,
} from "../../util/resource-transformation";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import { AgentClient } from "../llm/agent-client";
import { EventHandlerParams } from "../llm/async-adapters";

/**
 * Run the agent loop for processing ThreadMessages and generating decisions.
 *
 * This is a simpler alternative to the full decision loop that:
 * 1. Pre-fetches all MCP resources and caches them inline
 * 2. Converts messages to ChatCompletion format
 * 3. Streams responses from the LLM via the AgentClient
 * 4. Yields component decisions as they arrive
 *
 * @param agentClient - The agent client to use for generating responses
 * @param queue - Async queue for handling streaming events
 * @param messages - Array of thread messages to process
 * @param strictTools - Array of available tools in OpenAI format
 * @param resourceFetchers - Map of serverKey to resource fetcher functions for
 *   fetching MCP resources
 * @returns Async iterator of component decisions
 */
export async function* runAgentLoop(
  agentClient: AgentClient,
  queue: AsyncQueue<EventHandlerParams>,
  messages: ThreadMessage[],
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[],
  resourceFetchers: ResourceFetcherMap,
  //   customInstructions: string | undefined,
): AsyncIterableIterator<LegacyComponentDecision> {
  // Pre-fetch and cache all resources before converting messages
  const messagesWithCachedResources = await prefetchAndCacheResources(
    messages,
    resourceFetchers,
  );

  const chatCompletionMessages = threadMessagesToChatCompletionMessageParam(
    messagesWithCachedResources,
  );
  // const systemPromptArgs = customInstructions
  //     ? { custom_instructions: customInstructions }
  //     : {};

  const stream = agentClient.streamRunAgent(queue, {
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
      parentMessageId: message.parentMessageId,
      message: message.content || "",
      componentName: null,
      props: null,
      componentState: null,
      statusMessage: "",
      completionStatusMessage: "",
      toolCallRequest: toolCallRequest,
      toolCallId: toolCallId,
      reasoning: message.reasoning,
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
