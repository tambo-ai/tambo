import {
  ChatCompletionContentPart,
  ContentPartType,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import mime from "mime-types";
import { StorageService } from "../../common/services/storage.service";

const ATTACHMENT_URI_PREFIX = "attachment://";

/**
 * Check if content has any attachment URIs that need resolution.
 */
export function hasAttachmentUrls(
  content: ChatCompletionContentPart[],
): boolean {
  return content.some(
    (part) =>
      part.type === ContentPartType.Resource &&
      part.resource.uri?.startsWith(ATTACHMENT_URI_PREFIX),
  );
}

/**
 * Extract the storage path from an attachment URI.
 * @example "attachment://projectId/123-file.pdf" → "projectId/123-file.pdf"
 */
function extractStoragePath(uri: string): string {
  return uri.slice(ATTACHMENT_URI_PREFIX.length);
}

/**
 * Check if a MIME type represents text content.
 */
function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

/**
 * Process a single content part, resolving attachment URIs to inline content.
 */
async function processContentPart(
  part: ChatCompletionContentPart,
  storageService: StorageService,
): Promise<ChatCompletionContentPart> {
  if (part.type !== ContentPartType.Resource) {
    return part;
  }

  const uri = part.resource.uri;
  if (!uri?.startsWith(ATTACHMENT_URI_PREFIX)) {
    return part;
  }

  const storagePath = extractStoragePath(uri);

  const buffer = await storageService.get(storagePath);
  const mimeType =
    part.resource.mimeType ||
    mime.lookup(storagePath) ||
    "application/octet-stream";

  if (isTextMimeType(mimeType)) {
    return {
      type: ContentPartType.Resource,
      resource: {
        ...part.resource,
        mimeType,
        text: buffer.toString("utf-8"),
      },
    };
  }

  return {
    type: ContentPartType.Resource,
    resource: {
      ...part.resource,
      mimeType,
      blob: buffer.toString("base64"),
    },
  };
}

/**
 * Process all attachment URIs in a message's content, fetching and inlining the content.
 */
async function processMessageContent(
  content: ChatCompletionContentPart[],
  storageService: StorageService,
): Promise<ChatCompletionContentPart[]> {
  return await Promise.all(
    content.map(async (part) => await processContentPart(part, storageService)),
  );
}

/**
 * Process all attachment URLs in an array of messages.
 * Resolves attachment:// URIs to inline content (text or base64 blob).
 */
export async function processAttachmentUrlsInMessages(
  messages: ThreadMessage[],
  storageService: StorageService,
): Promise<ThreadMessage[]> {
  return await Promise.all(
    messages.map(async (message) => {
      if (!hasAttachmentUrls(message.content)) {
        return message;
      }

      const processedContent = await processMessageContent(
        message.content,
        storageService,
      );

      return {
        ...message,
        content: processedContent,
      };
    }),
  );
}
