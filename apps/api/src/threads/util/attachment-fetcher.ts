import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { S3Client } from "@aws-sdk/client-s3";
import { getFile } from "@tambo-ai-cloud/backend";
import mime from "mime-types";

const ATTACHMENT_PREFIX = "attachment://";

/**
 * MIME types that should be returned as text content.
 * All other types will be returned as base64-encoded blobs.
 */
const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "text/markdown",
  "text/csv",
  "text/xml",
  "application/json",
  "application/xml",
  "application/javascript",
]);

/**
 * Check if a MIME type should be treated as text content.
 */
function isTextMimeType(mimeType: string): boolean {
  return TEXT_MIME_TYPES.has(mimeType) || mimeType.startsWith("text/");
}

/**
 * Create an attachment fetcher function that can be registered with the ResourceFetcherMap.
 * This fetcher handles attachment:// URIs by retrieving files from S3 storage.
 *
 * @param s3Client - Configured S3Client instance
 * @param bucket - S3 bucket name where attachments are stored
 * @returns A function that fetches attachment content by URI
 *
 * @example
 * const fetcher = createAttachmentFetcher(s3Client, "user-files");
 * const result = await fetcher("attachment://proj_123/1704567890-doc.pdf");
 */
export function createAttachmentFetcher(
  s3Client: S3Client,
  bucket: string,
): (uri: string) => Promise<ReadResourceResult> {
  return async (uri: string): Promise<ReadResourceResult> => {
    if (!uri.startsWith(ATTACHMENT_PREFIX)) {
      throw new Error(
        `Invalid attachment URI: ${uri}. Must start with "${ATTACHMENT_PREFIX}"`,
      );
    }

    const storagePath = uri.slice(ATTACHMENT_PREFIX.length);
    const buffer = await getFile(s3Client, bucket, storagePath);
    const mimeType = mime.lookup(storagePath) || "application/octet-stream";

    if (isTextMimeType(mimeType)) {
      return {
        contents: [
          {
            uri,
            mimeType,
            text: buffer.toString("utf-8"),
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri,
          mimeType,
          blob: buffer.toString("base64"),
        },
      ],
    };
  };
}
