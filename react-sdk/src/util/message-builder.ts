import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";

/**
 * Parses text and extracts @-mentions as resource references. Resources are
 * identified by @ followed by optional server-key prefix (e.g., "my-mcp:") and
 * a URI (e.g., "my-spreadsheet://page2/cell4").
 *
 * Note this is just a temporary solution until we have an editor that can deal
 * with resource mentions directly.
 * @param text The text to parse
 * @returns Array of content parts with text and resource mentions parsed
 */
function parseResourceMentions(
  text: string,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  // Match @-mentions: @ followed by optional prefix (alphanumeric/hyphen + colon) and then a URI
  // URIs must contain at least one :// or : to distinguish from email addresses
  // Stops at whitespace or end of string
  const resourceRegex = /@([a-zA-Z0-9-]*:\/\/[^\s]+|[a-zA-Z0-9-]+:[^\s]+)/g;

  const parts: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = resourceRegex.exec(text)) !== null) {
    // Add text before the resource mention
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        text: text.slice(lastIndex, match.index),
      });
    }

    // Add the resource mention
    const resourceUri = match[1]; // The part after @
    parts.push({
      type: "resource",
      resource: {
        uri: resourceUri,
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  // If no resources were found, return original text as single part (unless empty string)
  if (parts.length === 0) {
    return text ? [{ type: "text", text }] : [];
  }

  return parts;
}

/**
 * Builds message content with text, resources, and images
 * Parses @-mentions in text and converts them to resource content parts.
 * @param text - The text content (may contain @-mentions for resources)
 * @param images - Array of staged images
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content = parseResourceMentions(text);

  for (const image of images) {
    content.push({
      type: "image_url",
      image_url: {
        url: image.dataUrl,
      },
    });
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or images");
  }

  return content;
}
