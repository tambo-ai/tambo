import type { ChatCompletionContentPartText } from "@tambo-ai-cloud/core";
import { ContentPartType } from "@tambo-ai-cloud/core";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedImage } from "../hooks/use-message-images";

/**
 * A parsed content part from text that can be either text or a resource reference.
 * This is an intermediate type used during parsing before converting to ChatCompletionContentPart.
 * The resource part uses a simplified resource object with just uri and optional name.
 */
type ParsedContentPart =
  | ChatCompletionContentPartText
  | {
      type: ContentPartType.Resource;
      resource: { uri: string; name?: string };
    };

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
 * @returns Array of content parts in order (text and resource parts interleaved)
 */
function parseResourceReferences(
  text: string,
  resourceNames: Record<string, string>,
): ParsedContentPart[] {
  const parts: ParsedContentPart[] = [];

  // Reset regex lastIndex to ensure we start from the beginning
  RESOURCE_REFERENCE_PATTERN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Find all resource references and interleave with text
  while ((match = RESOURCE_REFERENCE_PATTERN.exec(text)) !== null) {
    const [fullMatch, serverKey, uri] = match;
    const fullId = `${serverKey}:${uri}`;

    // Add text before this resource reference
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: "text", text: textBefore });
      }
    }

    // Add the resource part (serverKey is stripped, only URI is sent)
    // Look up name from the provided map
    // Try both fullId (serverKey:uri) and the original fullMatch (which includes @)
    const resource: { uri: string; name?: string } = { uri };
    const name =
      resourceNames[fullId] ||
      resourceNames[fullMatch.slice(1)] || // Remove @ prefix
      resourceNames[uri]; // Fallback to just URI (for single-server case)
    if (name) {
      resource.name = name;
    }
    parts.push({ type: ContentPartType.Resource, resource });

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text after the last resource reference
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push({ type: "text", text: textAfter });
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
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
  resourceNames: Record<string, string> = {},
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  if (text.trim()) {
    // Parse resource references from text - returns interleaved text and resource parts
    const parts = parseResourceReferences(text.trim(), resourceNames);
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
