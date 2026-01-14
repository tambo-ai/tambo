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
import { AgentClient } from "../llm/agent-client";
import { EventHandlerParams } from "../llm/async-adapters";

/**
 * Run the agent loop for processing ThreadMessages and generating decisions.
 *
 * This is a simpler alternative to the full decision loop that:
 * 1. Pre-fetches all MCP resources and caches them inline
 * 2. Streams responses from the LLM via the AgentClient
 * 3. Yields component decisions as they arrive
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
  // Pre-fetch and cache all resources before passing to agent
  const messagesWithCachedResources = await prefetchAndCacheResources(
    messages,
    resourceFetchers,
  );

  const stream = agentClient.streamRunAgent(queue, {
    messages: messagesWithCachedResources,
    tools: strictTools,
  });
  for await (const event of stream) {
    const { message } = event;

    const messageRole = toCoreMessageRole(message.role);
    if (!messageRole) {
      // `@ag-ui/core` messages can include roles (like `developer`/`activity`) that
      // aren't represented in `@tambo-ai-cloud/core`'s `MessageRole` enum.
      continue;
    }

    const toolCallId = getToolCallId(message);
    const toolCallRequest = getToolCallRequest(message);
    yield {
      id: message.id,
      role: messageRole,
      parentMessageId: message.parentMessageId,
      message: convertAguiMessageContentToString(message),
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

function toCoreMessageRole(role: Message["role"]): MessageRole | null {
  switch (role) {
    case "user": {
      return MessageRole.User;
    }
    case "assistant": {
      return MessageRole.Assistant;
    }
    case "system": {
      return MessageRole.System;
    }
    case "tool": {
      return MessageRole.Tool;
    }
    default: {
      return null;
    }
  }
}

function convertAguiMessageContentToString(message: Message): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (message.content === undefined) {
    return "";
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }
        return `[binary:${part.mimeType}]`;
      })
      .join("\n");
  }

  return JSON.stringify(message.content);
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
