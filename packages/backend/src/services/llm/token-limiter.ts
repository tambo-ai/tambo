import {
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { encode } from "gpt-tokenizer";

/**
 * Check if a URL is a data URL (base64 encoded binary data)
 */
function isDataUrl(url: string | undefined): boolean {
  return url?.startsWith("data:") === true;
}

/**
 * Create a copy of messages with binary blob data stripped for token counting.
 * Images and other binary content are handled separately by LLM providers
 * and don't consume text tokens, so we exclude them from the count.
 */
function stripBlobsForTokenCounting(
  messages: ThreadMessage[],
): ThreadMessage[] {
  return messages.map((message) => ({
    ...message,
    content: message.content.map((part) => {
      // Strip blobs from Resource content parts
      if (part.type === ContentPartType.Resource && "resource" in part) {
        const resource = part.resource;
        if (resource.blob) {
          // Strip blob but keep other metadata for accurate structure counting
          return {
            ...part,
            resource: {
              ...resource,
              blob: "[binary data excluded from token count]",
            },
          };
        }
      }
      // Strip data URLs from image_url content parts
      if (part.type === ContentPartType.ImageUrl && "image_url" in part) {
        if (isDataUrl(part.image_url.url)) {
          return {
            ...part,
            image_url: {
              ...part.image_url,
              url: "[data URL excluded from token count]",
            },
          };
        }
      }
      return part;
    }),
  }));
}

export function limitTokens(
  messages: ThreadMessage[],
  tokenLimit = 120000,
): ThreadMessage[] {
  // Count tokens without binary data (images don't consume text tokens)
  const messagesForCounting = stripBlobsForTokenCounting(messages);
  const tokenCount = encode(JSON.stringify(messagesForCounting)).length;

  if (tokenCount <= tokenLimit) {
    return messages;
  }

  const limitedMessages = truncateLimitingStrategy(messages, tokenLimit);

  return limitedMessages;
}

/**
 * Reduce to within token limit by taking the system message and newest messages until we hit the limit.
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
  // Strip blobs when counting tokens - binary data is handled separately by LLM providers
  const systemMessageForCounting = systemMessage
    ? stripBlobsForTokenCounting([systemMessage])[0]
    : null;
  let currentTokenCount = systemMessageForCounting
    ? encode(JSON.stringify([systemMessageForCounting])).length
    : 0;

  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const message = nonSystemMessages[i];
    // Strip blobs when counting this message's tokens
    const messageForCounting = stripBlobsForTokenCounting([message])[0];
    const messageTokens = encode(JSON.stringify([messageForCounting])).length;

    if (currentTokenCount + messageTokens <= tokenLimit) {
      limitedMessages.unshift(message);
      currentTokenCount += messageTokens;
    } else {
      break;
    }
  }

  // Add the system message to the front
  if (systemMessage) {
    limitedMessages.unshift(systemMessage);
  }

  console.log(`Token limit exceeded. Reduced to ${currentTokenCount} tokens`);

  return limitedMessages;
}
