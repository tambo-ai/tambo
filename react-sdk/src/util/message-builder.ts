import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";

/**
 * Parses text and extracts inline MCP resource mentions into `resource`
 * content parts.
 *
 * Inline syntax:
 * - `@<serverKey>:<uri>` where `<serverKey>` is present in `knownPrefixes`.
 * - `serverKey` must match `/^[a-zA-Z0-9_-]+$/` and is the same value exposed
 *   on `McpServerInfo.serverKey`.
 *
 * Example:
 * - `Please update server-a:issue://123` becomes:
 *   - `{ type: "text", text: "Please update " }`
 *   - `{ type: "resource", resource: { uri: "issue://123" } }`
 *
 * When no valid resource mention is found, this function returns either a
 * single `text` part with the original string, or an empty array for an empty
 * string. This is a temporary parser until we have an editor that can manage
 * resource mentions directly.
 * @param text The text to parse.
 * @param knownPrefixes Set of MCP server keys that are recognized prefixes.
 * @returns Array of content parts with text and resource mentions parsed.
 */
function parseResourceMentions(
  text: string,
  knownPrefixes: Set<string>,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  // Match @-mentions: @ followed by a serverKey-like prefix and a URI.
  // - serverKey: one or more of [a-zA-Z0-9_-]
  // - URI: any non-whitespace suffix after "://" or ":"
  //
  // NOTE: The `[a-zA-Z0-9_-]+` prefix must stay in sync with the serverKey
  // docs in `mcp-server-info.ts` and the validation in `normalizeServerInfo`
  // in `tambo-registry-provider.tsx`.
  const resourceRegex = /@([a-zA-Z0-9_-]+:\/\/[^\s]+|[a-zA-Z0-9_-]+:[^\s]+)/g;
  function matchesKnownPrefix(uri: string) {
    for (const prefix of knownPrefixes) {
      if (uri.startsWith(`${prefix}:`)) {
        return true;
      }
    }
    return false;
  }

  function pushTextPart(
    parts: TamboAI.Beta.Threads.ChatCompletionContentPart[],
    textPart: string,
  ) {
    if (!textPart) {
      return;
    }

    const last = parts[parts.length - 1];
    if (last?.type === "text") {
      last.text += textPart;
    } else {
      parts.push({
        type: "text",
        text: textPart,
      });
    }
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
      pushTextPart(parts, text.slice(lastIndex, match.index));
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
    pushTextPart(parts, text.slice(lastIndex));
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
