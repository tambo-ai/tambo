#!/usr/bin/env npx tsx
/**
 * Storage initialization script.
 * Creates the S3 bucket if it doesn't exist.
 *
 * Usage: npm run storage:init -w apps/api
 *
 * Supports:
 * - MinIO (via S3 CreateBucket API)
 * - Supabase (via Supabase REST API)
 */

import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/api/.env
config({ path: resolve(__dirname, "../.env") });

import {
  createS3Client,
  ensureBucket,
  isS3Configured,
} from "@tambo-ai-cloud/backend";

const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
const S3_REGION = process.env.S3_REGION ?? "us-east-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";
const S3_BUCKET = process.env.S3_BUCKET ?? "user-files";

// Supabase-specific env vars (for bucket creation via REST API)
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function isSupabaseEndpoint(endpoint: string): boolean {
  return endpoint.includes("supabase") || endpoint.includes("/storage/v1/s3");
}

async function createSupabaseBucket(
  supabaseUrl: string,
  serviceRoleKey: string,
  bucketName: string,
): Promise<boolean> {
  const url = `${supabaseUrl}/storage/v1/bucket`;

  try {
    // Check if bucket exists
    const checkResponse = await fetch(`${url}/${bucketName}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (checkResponse.ok) {
      console.log(`Bucket "${bucketName}" already exists`);
      return true;
    }

    // Create the bucket
    const createResponse = await fetch(url, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bucketName,
        name: bucketName,
        public: false,
      }),
    });

    if (createResponse.ok) {
      console.log(`Created bucket "${bucketName}"`);
      return true;
    }

    const error = await createResponse.text();
    console.error(`Failed to create bucket: ${error}`);
    return false;
  } catch (error) {
    console.error(`Error creating Supabase bucket:`, error);
    return false;
  }
}

async function createS3Bucket(): Promise<boolean> {
  const s3Config = {
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  };

  if (!isS3Configured(s3Config)) {
    console.error(
      "S3 not configured. Set S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
    );
    return false;
  }

  const client = createS3Client(s3Config);
  const success = await ensureBucket(client, S3_BUCKET);

  if (success) {
    console.log(`Bucket "${S3_BUCKET}" is ready`);
  } else {
    console.error(`Failed to create bucket "${S3_BUCKET}"`);
  }

  return success;
}

async function main(): Promise<void> {
  console.log("Initializing storage...");
  console.log(`Endpoint: ${S3_ENDPOINT}`);
  console.log(`Bucket: ${S3_BUCKET}`);

  let success: boolean;

  if (isSupabaseEndpoint(S3_ENDPOINT)) {
    console.log("Detected Supabase storage");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
      process.exit(1);
    }

    success = await createSupabaseBucket(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      S3_BUCKET,
    );
  } else {
    console.log("Using S3-compatible storage (MinIO/AWS)");
    success = await createS3Bucket();
  }

  if (!success) {
    process.exit(1);
  }

  console.log("Storage initialization complete");
}

main();
