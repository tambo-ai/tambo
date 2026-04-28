import { MessageRole, ThreadMessage } from "@tambo-ai-cloud/core";
import { encode } from "gpt-tokenizer";

export function limitTokens(
  messages: ThreadMessage[],
  tokenLimit = 120000,
): ThreadMessage[] {
  const tokenEncoding = encode(JSON.stringify(messages));

  if (tokenEncoding.length <= tokenLimit) {
    return messages;
  }

  const limitedMessages = truncateLimitingStrategy(messages, tokenLimit);

  return limitedMessages;
}

/**
 * Reduce to within token limit by taking the system message and newest messages until we hit the limit.
 *
 * After truncation, drops any leading Tool messages that lost their preceding
 * Assistant tool-call message. This prevents sending orphaned `tool_result`
 * blocks that violate the Anthropic message protocol. Orphaned `tool_use`
 * blocks (assistant with tool-call but no following tool-result) are handled
 * downstream by `repairToolCallPairing` in the message conversion layer.
 *
 * @param messages - The messages to limit.
 * @param tokenLimit - The token limit.
 * @returns The limited messages.
 */
function truncateLimitingStrategy(
  messages: ThreadMessage[],
  tokenLimit: number,
): ThreadMessage[] {
  const systemMessage = messages.find((msg) => msg.role === MessageRole.System);

  const nonSystemMessages = messages.filter(
    (msg) => msg.role !== MessageRole.System,
  );

  const limitedMessages: ThreadMessage[] = [];
  let currentTokenCount = systemMessage
    ? encode(JSON.stringify([systemMessage])).length
    : 0;

  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const message = nonSystemMessages[i];
    const messageTokens = encode(JSON.stringify([message])).length;

    if (currentTokenCount + messageTokens <= tokenLimit) {
      limitedMessages.unshift(message);
      currentTokenCount += messageTokens;
    } else {
      break;
    }
  }

  // Drop leading Tool messages that lost their preceding Assistant (orphaned tool_result)
  while (
    limitedMessages.length > 0 &&
    limitedMessages[0].role === MessageRole.Tool
  ) {
    limitedMessages.shift();
  }

  // Add the system message to the front
  if (systemMessage) {
    limitedMessages.unshift(systemMessage);
  }

  console.log(`Token limit exceeded. Reduced to ${currentTokenCount} tokens`);

  return limitedMessages;
}
