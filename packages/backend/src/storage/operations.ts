import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function getHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if (!("$metadata" in error)) return undefined;

  const metadata = (error as { $metadata?: unknown }).$metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  if (!("httpStatusCode" in metadata)) return undefined;

  const statusCode = (metadata as { httpStatusCode?: unknown }).httpStatusCode;
  return typeof statusCode === "number" ? statusCode : undefined;
}

function isMissingBucketError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const statusCode = getHttpStatusCode(error);

  return (
    statusCode === 404 ||
    error.name === "NotFound" ||
    error.name === "NoSuchBucket" ||
    error.name === "NotFoundException"
  );
}

export interface GetFileResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Retrieve a file from S3.
 * @param client - S3Client instance
 * @param bucket - Source bucket name
 * @param key - Object key (path) in the bucket
 * @returns File content as Buffer and ContentType from S3 metadata
 */
export async function getFile(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<GetFileResult> {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`No body returned for key: ${key}`);
  }

  // Early rejection if ContentLength is available and exceeds limit
  if (
    typeof response.ContentLength === "number" &&
    response.ContentLength > MAX_FILE_BYTES
  ) {
    throw new Error(`Attachment too large: ${response.ContentLength} bytes`);
  }

  // Convert readable stream to buffer with streaming size guard
  // This protects against OOM when ContentLength is missing or incorrect
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    totalBytes += chunk.byteLength;
    if (totalBytes > MAX_FILE_BYTES) {
      throw new Error(
        `Attachment too large: exceeded ${MAX_FILE_BYTES} bytes while streaming`,
      );
    }
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}

/**
 * Generate a presigned URL for uploading a file directly to S3.
 * @param client - S3Client instance
 * @param bucket - Target bucket name
 * @param key - Object key (path) in the bucket
 * @param mimeType - MIME type of the file to upload
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Presigned URL string
 */
export async function getSignedUploadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  mimeType: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Ensure a bucket exists, creating it if necessary.
 * @param client - S3Client instance
 * @param bucket - Target bucket name
 * @returns Resolves when the bucket exists or was created
 * @throws Error if the bucket cannot be accessed or created
 */
export async function ensureBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch (error) {
    // Bucket doesn't exist, try to create it
    if (isMissingBucketError(error)) {
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        return;
      } catch (createError) {
        // Bucket may have been created by another process
        if (
          createError instanceof Error &&
          (createError.name === "BucketAlreadyOwnedByYou" ||
            createError.name === "BucketAlreadyExists")
        ) {
          return;
        }
        throw createError;
      }
    }
    throw error;
  }
}
