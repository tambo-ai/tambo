# Storage Setup Guide

This guide covers setting up file storage for the Tambo API. The API supports S3-compatible storage backends.

## Overview

The storage system uses presigned URLs for direct browser-to-S3 uploads, avoiding file data flowing through the API server. The flow is:

1. Client requests a presigned URL via `POST /storage/presign`
2. API returns `{ uploadUrl, attachmentUri, expiresIn }`
3. Client uploads file directly to S3 using the presigned URL
4. Client uses the `attachmentUri` to reference the file in messages

Files are stored under `{projectId}/{uniqueId}-{signature}` where `uniqueId` is a 10-character base62 ID and `signature` is an 8-character HMAC suffix.

## Quick Start

```bash
# 1. Start MinIO
docker compose --env-file docker.env up minio -d

# 2. Initialize storage bucket
npm run storage:init -w apps/api

# 3. Start the API
npm run dev:api
```

## Environment Variables

Configure in `apps/api/.env`:

```bash
S3_ENDPOINT=<endpoint-url>
S3_REGION=<region>
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET=user-files

# For Supabase only (bucket creation via REST API)
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Option 1: MinIO (Recommended for Local Dev)

MinIO provides full S3 API compatibility and works out of the box.

### Setup

1. Start MinIO via Docker Compose:

```bash
docker compose --env-file docker.env up minio -d
```

2. Configure environment variables in `apps/api/.env`:

```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=user-files
```

3. Initialize storage (creates bucket if needed):

```bash
npm run storage:init -w apps/api
```

4. Start the API:

```bash
npm run dev:api
```

### Alternative: Manual Bucket Creation

Access MinIO Console at http://localhost:9001 (login: minioadmin/minioadmin) and create a bucket, or use the mc CLI:

```bash
docker exec tambo_minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec tambo_minio mc mb local/user-files
```

### Testing

**Step 1: Get a presigned URL**

```bash
curl -X POST http://localhost:3001/storage/presign \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contentType": "text/plain", "size": 1024}'
```

Response:

```json
{
  "uploadUrl": "http://localhost:9000/user-files/p_abc123/Ab3xY9kLmN-deadbeef?X-Amz-Signature=...",
  "attachmentUri": "attachment://p_abc123/Ab3xY9kLmN",
  "expiresIn": 3600
}
```

Note: The `attachmentUri` contains only `{projectId}/{uniqueId}`. The signature suffix is added internally when resolving the S3 key.

**Step 2: Upload file directly to S3**

```bash
curl -X PUT "<uploadUrl from step 1>" \
  -H "Content-Type: text/plain" \
  --data-binary @/path/to/file.txt
```

## Option 2: Supabase Storage

Supabase provides S3-compatible storage but requires additional configuration.

### Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Local Supabase project initialized (`supabase init`)

### Setup

1. **Enable S3 Protocol** - Add to `supabase/config.toml`:

```toml
[storage]
enabled = true
file_size_limit = "50MiB"

[storage.s3_protocol]
enabled = true
```

> **Important**: The S3 protocol is NOT enabled by default. Without this setting, S3 PUT operations will return 404.

2. Restart Supabase:

```bash
supabase stop
supabase start
```

3. Note the S3 credentials from the output:

```
Storage (S3)
├────────────┬──────────────────────────────────────────────────────────────────┤
│ URL        │ http://127.0.0.1:54321/storage/v1/s3                             │
│ Access Key │ <access-key>                                                     │
│ Secret Key │ <secret-key>                                                     │
│ Region     │ local                                                            │
```

4. Configure environment variables in `apps/api/.env`:

```bash
# S3 credentials from supabase start output
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3
S3_REGION=local
S3_ACCESS_KEY_ID=<access-key-from-supabase-start>
S3_SECRET_ACCESS_KEY=<secret-key-from-supabase-start>
S3_BUCKET=user-files

# Required for bucket creation via Supabase REST API
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

5. Initialize storage (creates bucket if needed):

```bash
npm run storage:init -w apps/api
```

6. Start the API:

```bash
npm run dev:api
```

### Alternative: Manual Bucket Creation

Via Supabase Studio at http://127.0.0.1:54323 under Storage, or using curl:

```bash
curl -X POST "http://127.0.0.1:54321/storage/v1/bucket" \
  -H "apikey: <service-role-key>" \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"id": "user-files", "name": "user-files", "public": false}'
```

### Supabase S3 Compatibility Notes

- Supabase S3 is in **Public Alpha** as of 2025
- S3 protocol must be explicitly enabled in config.toml
- Supports: PutObject, GetObject, ListObjects, DeleteObject
- Uses AWS Signature Version 4 for authentication
- See [Supabase S3 Compatibility Docs](https://supabase.com/docs/guides/storage/s3/compatibility)

## Option 3: AWS S3 / Other S3-Compatible Services

For production or other S3-compatible services (Cloudflare R2, Backblaze B2, etc.):

```bash
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com  # or your provider's endpoint
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<your-access-key>
S3_SECRET_ACCESS_KEY=<your-secret-key>
S3_BUCKET=your-bucket-name
```

## CORS Configuration

For direct browser-to-S3 uploads, CORS must be configured on the S3 bucket (not the API).

### MinIO

Via MinIO Console at http://localhost:9001, or using mc CLI:

```bash
# Create a CORS config file
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply CORS config
docker exec tambo_minio mc anonymous set-json /tmp/cors.json local/user-files
```

### AWS S3

Via AWS Console or CLI:

```bash
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}'
```

### Cloudflare R2

Via Cloudflare Dashboard under R2 > your-bucket > Settings > CORS Policy.

## Troubleshooting

### API uploads go to wrong storage backend

S3 storage config should **only** be in `apps/api/.env` (not the root `.env`). If you have S3 config in both places, `apps/api/.env` takes precedence.

### "Storage not configured" error

The API returns this when S3 credentials are missing or invalid. Check that all `S3_*` environment variables are set.

### Supabase S3 PUT returns 404

Enable the S3 protocol in `supabase/config.toml`:

```toml
[storage.s3_protocol]
enabled = true
```

Then restart Supabase (`supabase stop && supabase start`).

### Port conflicts with multiple Supabase projects

If you have multiple Supabase projects, stop the conflicting one:

```bash
supabase stop --project-id <other-project-id>
supabase start
```

### Files upload but can't be retrieved

Ensure the bucket exists and the API has restarted after configuration changes. Check storage logs:

```bash
docker logs supabase_storage_<project-id> 2>&1 | tail -20
```

### Browser CORS errors on direct upload

Ensure CORS is configured on the S3 bucket (see CORS Configuration section above). The presigned URL includes authentication, but the bucket must allow cross-origin PUT requests.

## Architecture

```
Upload Flow (presigned URLs):
Client → POST /storage/presign → API generates presigned URL
                                      ↓
                          Returns: { uploadUrl, attachmentUri, expiresIn }
                                      ↓
Client → PUT uploadUrl → S3 (direct upload, bypasses API)

Retrieval Flow (for LLM processing):
Client → Thread with attachment:// URI → API → AttachmentFetcher → S3
                                                      ↓
                                          Returns file content for LLM
```

The `attachment://` URI scheme is resolved by `AttachmentFetcher` when processing thread messages, allowing the LLM to access uploaded file content. The retrieval still goes through the API because LLMs cannot access S3 directly.
