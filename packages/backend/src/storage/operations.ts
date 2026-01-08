import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Upload a file to S3.
 * @param client - S3Client instance
 * @param bucket - Target bucket name
 * @param key - Object key (path) in the bucket
 * @param buffer - File content as Buffer
 * @param mimeType - MIME type of the file
 * @returns The key of the uploaded object
 */
export async function uploadFile(
  client: S3Client,
  bucket: string,
  key: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
  return key;
}

/**
 * Retrieve a file from S3.
 * @param client - S3Client instance
 * @param bucket - Source bucket name
 * @param key - Object key (path) in the bucket
 * @returns File content as Buffer
 */
export async function getFile(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<Buffer> {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`No body returned for key: ${key}`);
  }

  // Convert readable stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
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
 * @returns True if bucket exists or was created, false if creation failed
 */
export async function ensureBucket(
  client: S3Client,
  bucket: string,
): Promise<boolean> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (error) {
    // Bucket doesn't exist, try to create it
    if (
      error instanceof Error &&
      (error.name === "NotFound" || error.name === "NoSuchBucket")
    ) {
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        return true;
      } catch (createError) {
        // Bucket may have been created by another process
        if (
          createError instanceof Error &&
          createError.name === "BucketAlreadyOwnedByYou"
        ) {
          return true;
        }
        return false;
      }
    }
    return false;
  }
}
