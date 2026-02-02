import { S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createS3Client, isS3Configured } from "@tambo-ai-cloud/backend";
import { Merge } from "ts-essentials";
/**
 * Centralized S3 storage configuration service.
 * Provides a single source of truth for S3 client initialization
 * and storage-related configuration across the API.
 */
@Injectable()
export class StorageConfigService {
  readonly s3Client: S3Client | undefined;
  readonly bucket: string;
  readonly signingSecret: string;

  constructor(private readonly configService: ConfigService) {
    const s3Config = {
      endpoint: this.configService.get<string>("S3_ENDPOINT") ?? "",
      region: this.configService.get<string>("S3_REGION") ?? "us-east-1",
      accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID") ?? "",
      secretAccessKey:
        this.configService.get<string>("S3_SECRET_ACCESS_KEY") ?? "",
    };
    const bucket = this.configService.get<string>("S3_BUCKET") ?? "";
    this.bucket = bucket.trim();

    const secret = this.configService.get<string>("API_KEY_SECRET");
    this.signingSecret = secret?.trim() ?? "";

    if (isS3Configured(s3Config)) {
      this.s3Client = createS3Client(s3Config);
    }
  }

  /**
   * Check if storage is fully configured for attachment operations.
   * Requires both S3 client and signing secret to be available.
   * @returns true if storage is configured with S3 client, non-empty bucket, and signing secret
   */
  hasStorageConfig(): this is Merge<
    StorageConfigService,
    { s3Client: S3Client }
  > {
    return (
      this.s3Client !== undefined &&
      this.bucket.length > 0 &&
      this.signingSecret.length > 0
    );
  }
}
