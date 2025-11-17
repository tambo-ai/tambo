import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";

/**
 * Parses text and extracts @-mentions as resource references. Resources are
 * identified by @ followed by optional server-key prefix (e.g., "my-mcp:") and
 * a URI (e.g., "my-spreadsheet://page2/cell4").
 *
 * If a whitelist of known prefixes is provided, any recognized prefix will be
 * stripped from the resource URI before creating the content part. This allows
 * the URI to be sent directly to the MCP server without the local prefix.
 *
 * Note this is just a temporary solution until we have an editor that can deal
 * with resource mentions directly.
 * @param text The text to parse
 * @param knownPrefixes Optional set of MCP server keys that are recognized prefixes. If a resource URI starts with one of these prefixes, it will be stripped.
 * @returns Array of content parts with text and resource mentions parsed
 */
function parseResourceMentions(
  text: string,
  knownPrefixes: Set<string>,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  // Match @-mentions: @ followed by optional prefix (alphanumeric/hyphen + colon) and then a URI
  // URIs must contain at least one :// or : to distinguish from email addresses
  // Stops at whitespace or end of string
  const resourceRegex = /@([a-zA-Z0-9-]*:\/\/[^\s]+|[a-zA-Z0-9-]+:[^\s]+)/g;
  function matchesKnownPrefix(uri: string) {
    for (const prefix of knownPrefixes) {
      if (uri.startsWith(`${prefix}:`)) {
        return true;
      }
    }
    return false;
  }

  const parts: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];
  let lastIndex = 0;

  // Use matchAll to get all matches without relying on regex internal state
  const matches = Array.from(text.matchAll(resourceRegex));

  for (const match of matches) {
    const resourceUri = match[1]; // The part after @, e.g., "ss:my-spreadsheet://page2/cell4"

    // Only process if this specific match starts with a known prefix
    if (!matchesKnownPrefix(resourceUri)) {
      continue; // Skip this resource, it doesn't have a known prefix
    }

    // Add text before the resource mention
    if (match.index !== undefined && match.index > lastIndex) {
      parts.push({
        type: "text",
        text: text.slice(lastIndex, match.index),
      });
    }

    // Strip the known prefix from the URI
    let strippedUri = resourceUri;
    for (const prefix of knownPrefixes) {
      if (strippedUri.startsWith(`${prefix}:`)) {
        strippedUri = strippedUri.slice(prefix.length + 1);
        break;
      }
    }

    parts.push({
      type: "resource",
      resource: {
        uri: strippedUri,
      },
    });

    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
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
 * @param knownPrefixes - Optional set of MCP server keys that are recognized prefixes. If a resource URI starts with one of these, it will be stripped before sending to the server.
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
  knownPrefixes: Set<string>,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content = parseResourceMentions(text, knownPrefixes);

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
