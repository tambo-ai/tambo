import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedAttachment } from "../hooks/use-message-attachments";

/**
 * @deprecated Use StagedAttachment instead
 */
export type StagedImage = StagedAttachment;

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
 * Parse a data URL to extract the base64 content.
 * Handles data URLs with optional parameters like charset.
 * @param dataUrl - Data URL in format "data:mime/type;base64,<data>" or "data:mime/type;charset=utf-8;base64,<data>"
 * @returns The base64 content portion, or undefined if invalid
 */
function parseDataUrlToBase64(dataUrl: string): string | undefined {
  // Match data URLs with optional parameters before ;base64,
  // Examples:
  //   data:image/png;base64,... -> matches
  //   data:text/plain;charset=utf-8;base64,... -> matches
  //   data:application/json;charset=utf-8;base64,... -> matches
  const match = /^data:[^;]+(?:;[^;]+)*;base64,(.+)$/.exec(dataUrl);
  return match?.[1];
}

/**
 * Build Resource content parts from staged files.
 * All attachments (images, documents, text) use the unified Resource type.
 * Supports both cloud storage (storagePath) and local mode (dataUrl).
 * @param attachments - Array of staged attachments with storage paths or data URLs
 * @returns Array of Resource content parts
 */
function buildAttachmentResourceParts(
  attachments: StagedAttachment[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  return attachments
    .filter((a) => a.status === "uploaded")
    .map((a): TamboAI.Beta.Threads.ChatCompletionContentPart | null => {
      // Prefer storage path when available (cloud mode)
      if (a.storagePath) {
        return {
          type: "resource" as const,
          resource: {
            uri: `attachment://${a.storagePath}`,
            name: a.name,
            mimeType: a.mimeType,
          },
        };
      }

      // Fall back to dataUrl for local mode - only include if we can extract the blob
      if (a.dataUrl) {
        const blob = parseDataUrlToBase64(a.dataUrl);
        if (blob) {
          return {
            type: "resource" as const,
            resource: {
              uri: `local://${a.id}`,
              name: a.name,
              mimeType: a.mimeType,
              blob,
            },
          };
        }
        // dataUrl is invalid, log warning and skip this attachment
        console.warn(
          `Unable to parse dataUrl for attachment "${a.name}", skipping from message`,
        );
      }

      // No valid storagePath or dataUrl - skip this attachment
      return null;
    })
    .filter(
      (part): part is TamboAI.Beta.Threads.ChatCompletionContentPart =>
        part !== null,
    );
}

/**
 * Builds message content with text, MCP resource references, and attachments.
 * All attachments (images, documents, text files) are converted to Resource content parts
 * with attachment:// URIs. The backend resolves these to inline content before sending
 * to LLM providers.
 * @param text - The text content, may include \@serverKey:uri resource references
 * @param attachments - Array of staged attachments (uploaded to storage)
 * @param resourceNames - Map of resource IDs (serverKey:uri) to their display names
 * @param resourceContent - Optional map of prefixed URIs to resolved content (for client-side resources)
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  attachments: StagedAttachment[],
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

  // Add attachment resources at the end
  const attachmentResources = buildAttachmentResourceParts(attachments);
  content.push(...attachmentResources);

  if (content.length === 0) {
    throw new Error("Message must contain text or attachments");
  }

  return content;
}
