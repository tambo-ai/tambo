import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";

/**
 * Regular expression to match MCP resource references in the format: \@serverKey:uri
 *
 * Examples:
 * - \@tambo-1hfs429:tambo:test://static/resource/1
 * - \@linear:file://path/to/file
 *
 * Pattern breakdown:
 * - \@              - Literal \@ symbol
 * - ([a-zA-Z0-9-]+) - Server key (alphanumeric + hyphens, client-side routing key)
 * - :               - Literal colon separator
 * - (\S+)           - URI (non-whitespace characters, actual resource URI)
 */
const RESOURCE_REFERENCE_PATTERN = /@([a-zA-Z0-9-]+):(\S+)/g;

/**
 * Parses text with resource references and returns interleaved content parts.
 * Resource references have the format: \@serverKey:uri
 *
 * The serverKey prefix is stripped before sending to the backend because:
 * - It's a client-side routing key (e.g., "tambo-1hfs429") used by React SDK to route to the correct MCP connection
 * - The backend only needs the actual resource URI (e.g., "tambo:test://static/resource/1")
 * - The backend routes resources based on the thread's MCP server configuration, not client-side keys
 * @param text - Text potentially containing resource references
 * @param resourceNames - Map of full resource IDs (serverKey:uri) to their display names
 * @param resourceContent - Optional map of prefixed URIs to resolved content (for client-side resources)
 * @returns Array of content parts in order (text and resource parts interleaved)
 */
function parseResourceReferences(
  text: string,
  resourceNames: Record<string, string>,
  resourceContent?: Map<string, ReadResourceResult>,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const parts: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  // Use matchAll to avoid global regex state issues
  const matches = Array.from(text.matchAll(RESOURCE_REFERENCE_PATTERN));
  let lastIndex = 0;

  // Find all resource references and interleave with text
  for (const match of matches) {
    const [fullMatch, serverKey, uri] = match;
    const fullId = `${serverKey}:${uri}`;

    // Add text before this resource reference (preserve whitespace)
    if (match.index !== undefined && match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.length > 0) {
        parts.push({
          type: "text",
          text: textBefore,
        });
      }
    }

    const resource: TamboAI.Resource = { uri };
    const name = resourceNames[fullId];
    if (name) {
      resource.name = name;
    }

    // Include resolved content for client-side resources (MCP and registry)
    // Server-side resources won't be in the map - backend resolves them by URI
    const resolvedContent = resourceContent?.get(fullId);
    if (resolvedContent?.contents?.[0]) {
      const content = resolvedContent.contents[0];
      if ("text" in content && content.text) {
        resource.text = content.text;
      } else if ("blob" in content && content.blob) {
        resource.blob = content.blob;
      }
      if ("mimeType" in content && content.mimeType) {
        resource.mimeType = content.mimeType;
      }
    }

    parts.push({ type: "resource", resource });

    if (match.index !== undefined) {
      lastIndex = match.index + fullMatch.length;
    }
  }

  // Add remaining text after the last resource reference (preserve whitespace)
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex);
    if (textAfter.length > 0) {
      parts.push({
        type: "text",
        text: textAfter,
      });
    }
  }

  // If no resource references were found, return the whole text as a single text part
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: "text", text });
  }

  return parts;
}

/**
 * Builds message content with text, MCP resource references, and images
 * @param text - The text content, may include \@serverKey:uri resource references
 * @param images - Array of staged images
 * @param resourceNames - Map of resource IDs (serverKey:uri) to their display names
 * @param resourceContent - Optional map of prefixed URIs to resolved content (for client-side resources)
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
  resourceNames: Record<string, string> = {},
  resourceContent?: Map<string, ReadResourceResult>,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  const hasNonWhitespaceText = text.trim().length > 0;

  if (hasNonWhitespaceText) {
    // Parse resource references from the original text so that all
    // user-visible whitespace (including leading/trailing spaces and
    // internal spacing) is preserved in the resulting content parts.
    const parts = parseResourceReferences(text, resourceNames, resourceContent);
    content.push(...parts);
  }

  // Add images at the end
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
