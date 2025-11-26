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
 * Parses MCP resource references from text and extracts them into separate content parts.
 * Resource references have the format: \@serverKey:uri
 *
 * The serverKey prefix is stripped before sending to the backend because:
 * - It's a client-side routing key (e.g., "tambo-1hfs429") used by React SDK to route to the correct MCP connection
 * - The backend only needs the actual resource URI (e.g., "tambo:test://static/resource/1")
 * - The backend routes resources based on the thread's MCP server configuration, not client-side keys
 * @param text - Text potentially containing resource references
 * @returns Object with parsed resources (URI only, prefix stripped) and remaining text, plus full reference for display
 */
function parseResourceReferences(text: string): {
  resources: { uri: string; fullReference: string }[];
  remainingText: string;
} {
  const resources: { uri: string; fullReference: string }[] = [];
  let remainingText = text;

  // Find all resource references
  const matches = text.matchAll(RESOURCE_REFERENCE_PATTERN);
  for (const match of matches) {
    const [fullMatch, serverKey, uri] = match;
    // Store the actual URI (without client-side prefix) to send to backend
    // And the full reference for display purposes
    resources.push({
      uri, // Just the URI part for the API
      fullReference: `${serverKey}:${uri}`, // Full prefixed version for display
    });
    // Remove the @ symbol and entire reference from text
    remainingText = remainingText.replace(fullMatch, "").trim();
  }

  return { resources, remainingText };
}

/**
 * Builds message content with text, MCP resource references, and images
 * @param text - The text content, may include \@serverKey:uri resource references
 * @param images - Array of staged images
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  if (text.trim()) {
    // Parse resource references from text
    const { resources, remainingText } = parseResourceReferences(text.trim());

    // Add remaining text if any
    if (remainingText) {
      content.push({
        type: "text",
        text: remainingText,
      });
    }

    // Add resource content parts with just the URI (client-side prefix stripped)
    for (const { uri } of resources) {
      content.push({
        type: "resource",
        resource: {
          uri,
        },
      });
    }
  }

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
