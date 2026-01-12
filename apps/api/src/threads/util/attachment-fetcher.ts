import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { S3Client } from "@aws-sdk/client-s3";
import { getFile } from "@tambo-ai-cloud/backend";
import { parseAttachmentUri } from "@tambo-ai-cloud/core";

/**
 * Non-text MIME types that should still be treated as text content.
 * The isTextMimeType function also checks for the "text/" prefix,
 * so this set only needs application/* types that are text-based.
 */
const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
]);

/**
 * Check if a MIME type should be treated as text content.
 */
function isTextMimeType(mimeType: string): boolean {
  return mimeType.startsWith("text/") || TEXT_MIME_TYPES.has(mimeType);
}

/**
 * Create an attachment fetcher function that can be registered with the ResourceFetcherMap.
 * This fetcher handles attachment:// URIs by retrieving files from S3 storage.
 *
 * The attachment URI format is: attachment://{projectId}/{uniqueId}
 * The actual S3 key includes a signature suffix for security.
 *
 * @param s3Client - Configured S3Client instance
 * @param bucket - S3 bucket name where attachments are stored
 * @param allowedProjectId - The project ID that is allowed to access attachments
 * @param signingSecret - Secret used to verify and reconstruct S3 keys
 * @returns A function that fetches attachment content by URI
 *
 * @example
 * const fetcher = createAttachmentFetcher(s3Client, "user-files", "p_123abc", "secret");
 * const result = await fetcher("attachment://p_123abc/Ab3xY9kLmN");
 */
export function createAttachmentFetcher(
  s3Client: S3Client,
  bucket: string,
  allowedProjectId: string,
  signingSecret: string,
): (uri: string) => Promise<ReadResourceResult> {
  if (!allowedProjectId.trim()) {
    throw new Error("allowedProjectId must be non-empty");
  }

  if (!signingSecret) {
    throw new Error("signingSecret must be non-empty");
  }

  return async (uri: string): Promise<ReadResourceResult> => {
    // Parse the URI and reconstruct the storage key with signature
    const { projectId, storageKey } = parseAttachmentUri(uri, signingSecret);

    // Verify the project ID matches the allowed project
    if (projectId !== allowedProjectId) {
      throw new Error("Attachment access denied");
    }

    // Get file content and ContentType from S3 metadata
    const { buffer, contentType } = await getFile(s3Client, bucket, storageKey);

    if (isTextMimeType(contentType)) {
      return {
        contents: [
          {
            uri,
            mimeType: contentType,
            text: buffer.toString("utf-8"),
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri,
          mimeType: contentType,
          blob: buffer.toString("base64"),
        },
      ],
    };
  };
}
