import { S3Client } from "@aws-sdk/client-s3";

export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Check if all required S3 configuration values are present.
 * @param config - Partial S3 configuration object
 * @returns True if all required fields are present and non-empty
 */
export function isS3Configured(config: Partial<S3Config>): config is S3Config {
  return !!(
    config.endpoint &&
    config.region &&
    config.accessKeyId &&
    config.secretAccessKey
  );
}

/**
 * Create an S3 client with the provided configuration.
 * @param config - S3 configuration containing endpoint, region, and credentials
 * @returns Configured S3Client instance
 */
export function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Required for S3-compatible services like Supabase
  });
}
