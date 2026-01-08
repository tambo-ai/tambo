import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedAttachment } from "../hooks/use-message-attachments";

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
 * Builds message content with text, MCP resource references, and attachments.
 * Supports images (as image_url), text files (as file with text content),
 * and documents like PDFs (as file with base64 content).
 * @param text - The text content, may include \@serverKey:uri resource references
 * @param attachments - Array of staged attachments (images, documents, text files)
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

  // Add attachments at the end, handling each type appropriately
  for (const attachment of attachments) {
    const contentPart = buildAttachmentContentPart(attachment);
    content.push(contentPart);
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or attachments");
  }

  return content;
}

/**
 * Builds a content part for an attachment based on its type.
 *
 * If the attachment has been uploaded (uploadResult is present), uses the
 * attachment:// URI to reference the file in S3. The backend fetches the
 * content when processing the message.
 *
 * If no upload result (legacy/fallback mode), embeds content inline:
 * - Images: image_url with base64 data URL
 * - Text files: resource with inline text content
 * - Documents (PDF): resource with base64 blob
 * @param attachment - The staged attachment
 * @returns The appropriate content part for the attachment type
 */
function buildAttachmentContentPart(
  attachment: StagedAttachment,
): TamboAI.Beta.Threads.ChatCompletionContentPart {
  // If attachment was uploaded to S3, use the attachment URI
  // Backend will fetch the content from S3 when processing
  if (attachment.uploadResult) {
    return {
      type: "resource",
      resource: {
        uri: attachment.uploadResult.attachmentUri,
        name: attachment.uploadResult.filename,
        mimeType: attachment.uploadResult.mimeType,
      },
    };
  }

  // Fallback to inline content (legacy mode when no client was provided)
  switch (attachment.attachmentType) {
    case "image":
      return {
        type: "image_url",
        image_url: {
          url: attachment.dataUrl,
        },
      };

    case "text":
      // For text files, use resource with inline text content
      return {
        type: "resource",
        resource: {
          uri: `attachment://${attachment.name}`,
          name: attachment.name,
          mimeType: attachment.mimeType,
          text: attachment.textContent ?? "",
        },
      };

    case "document": {
      // For documents like PDFs, use resource with base64 blob
      // Extract base64 data from data URL (format: data:mime/type;base64,<data>)
      const base64Data = attachment.dataUrl.split(",")[1] ?? "";
      return {
        type: "resource",
        resource: {
          uri: `attachment://${attachment.name}`,
          name: attachment.name,
          mimeType: attachment.mimeType,
          blob: base64Data,
        },
      };
    }

    default: {
      // Fallback: treat as binary file using resource with blob
      const fallbackBase64 = attachment.dataUrl.split(",")[1] ?? "";
      return {
        type: "resource",
        resource: {
          uri: `attachment://${attachment.name}`,
          name: attachment.name,
          mimeType: attachment.mimeType,
          blob: fallbackBase64,
        },
      };
    }
  }
}
