import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * S3-compatible storage service.
 *
 * Works with any S3-compatible provider:
 * - AWS S3
 * - Supabase Storage (default)
 * - MinIO
 * - Cloudflare R2
 * - DigitalOcean Spaces
 *
 * Configure via environment variables:
 * - S3_ENDPOINT: The S3 endpoint URL (for Supabase: https://<project>.supabase.co/storage/v1/s3)
 * - S3_REGION: The S3 region (default: us-east-1)
 * - S3_ACCESS_KEY_ID: Access key ID
 * - S3_SECRET_ACCESS_KEY: Secret access key
 * - S3_BUCKET: The bucket name (default: user-files)
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>("S3_ENDPOINT");
    const accessKeyId = this.configService.get<string>("S3_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>(
      "S3_SECRET_ACCESS_KEY",
    );

    this.bucket = this.configService.get<string>("S3_BUCKET") ?? "user-files";
    const region = this.configService.get<string>("S3_REGION") ?? "us-east-1";

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      console.warn(
        "StorageService: Not configured. Missing S3_ENDPOINT, S3_ACCESS_KEY_ID, or S3_SECRET_ACCESS_KEY.",
      );
      this.client = null;
      this.configured = false;
      return;
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for Supabase and most S3-compatible services
    });

    this.configured = true;
    console.log("StorageService: Configured with S3-compatible storage");
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private requireClient(): S3Client {
    if (!this.client) {
      throw new Error("Storage service not configured");
    }
    return this.client;
  }

  /**
   * Upload a file to storage.
   * @returns The storage path (e.g., "projectId/timestamp-filename.pdf")
   */
  async upload(
    projectId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const client = this.requireClient();
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${projectId}/${timestamp}-${sanitizedFileName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return key;
  }

  /**
   * Get a file from storage.
   * @returns The file contents as a Buffer
   */
  async get(path: string): Promise<Buffer> {
    const client = this.requireClient();

    const response = await client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    if (!response.Body) {
      throw new Error(`File not found: ${path}`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  /**
   * Delete a file from storage.
   */
  async delete(path: string): Promise<void> {
    const client = this.requireClient();

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );
  }

  /**
   * Get a signed URL for temporary access to a file.
   * @param path The storage path
   * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
   * @returns A signed URL
   */
  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const client = this.requireClient();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return await getSignedUrl(client, command, { expiresIn });
  }
}
