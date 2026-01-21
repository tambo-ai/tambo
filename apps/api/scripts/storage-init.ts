#!/usr/bin/env npx tsx
/**
 * Storage initialization script.
 * Creates the S3 bucket if it doesn't exist.
 *
 * Usage: npm run storage:init -w apps/api
 * Supports (set STORAGE_PROVIDER=supabase for Supabase):
 * - MinIO (via S3 CreateBucket API)
 * - Supabase (via Supabase REST API)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from apps/api/.env (script is in apps/api/scripts/)
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

const rawStorageProvider = process.env.STORAGE_PROVIDER;
const storageProvider = (rawStorageProvider ?? "s3").toLowerCase();

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

    if (checkResponse.status === 401 || checkResponse.status === 403) {
      console.error(
        "Supabase credentials invalid/insufficient (need service role key)",
      );
      return false;
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

    if (createResponse.status === 409) {
      console.log(`Bucket "${bucketName}" already exists`);
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

  try {
    await ensureBucket(client, S3_BUCKET);
    console.log(`Bucket "${S3_BUCKET}" is ready`);
    return true;
  } catch (error) {
    console.error(`Failed to create bucket "${S3_BUCKET}"`);
    console.error(error);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("Initializing storage...");
  console.log(`Endpoint: ${S3_ENDPOINT}`);
  console.log(`Bucket: ${S3_BUCKET}`);

  let success: boolean;

  if (
    !rawStorageProvider &&
    (SUPABASE_URL.trim() !== "" || SUPABASE_SERVICE_ROLE_KEY.trim() !== "")
  ) {
    console.warn(
      "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are set but STORAGE_PROVIDER is not. Defaulting to STORAGE_PROVIDER=s3.",
    );
  }

  if (storageProvider === "supabase") {
    console.log("Using Supabase storage");

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
  } else if (storageProvider === "s3") {
    console.log("Using S3-compatible storage (MinIO/AWS)");
    success = await createS3Bucket();
  } else {
    console.error(
      `Invalid STORAGE_PROVIDER: ${rawStorageProvider ?? "<unset>"}. Expected "s3" or "supabase" (normalized: "${storageProvider}").`,
    );
    process.exit(1);
  }

  if (!success) {
    process.exit(1);
  }

  console.log("Storage initialization complete");
}

void main();
