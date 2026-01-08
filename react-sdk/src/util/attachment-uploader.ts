import type TamboAI from "@tambo-ai/typescript-sdk";
import { AttachmentType } from "../hooks/use-message-attachments";

/** Maximum file size in bytes (10MB, matching API limit) */
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

/**
 * Response from the presign endpoint
 */
interface PresignResponse {
  uploadUrl: string;
  attachmentUri: string;
  expiresIn: number;
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  /** The attachment URI to reference this file in messages (e.g., attachment://projectId/...) */
  attachmentUri: string;
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  mimeType: string;
  /** Category of the attachment */
  attachmentType: AttachmentType;
}

/**
 * Error thrown when file upload fails
 */
export class AttachmentUploadError extends Error {
  constructor(
    message: string,
    public readonly filename: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AttachmentUploadError";
  }
}

/**
 * Uploads a file to storage using presigned URLs.
 *
 * Flow:
 * 1. Request a presigned URL from the API
 * 2. Upload the file directly to S3 using the presigned URL
 * 3. Return the attachment URI for use in messages
 * @param client - The TamboAI client instance
 * @param file - The file to upload
 * @param mimeType - The MIME type of the file
 * @param attachmentType - The category of the attachment
 * @returns The upload result with attachment URI
 * @throws {AttachmentUploadError} if upload fails
 *
 * TODO: Replace client.post("/storage/presign", ...) with a typed SDK method
 * once `@tambo-ai/typescript-sdk` adds storage support. This will provide
 * compile-time type safety for the request/response DTOs.
 */
export async function uploadAttachment(
  client: TamboAI,
  file: File,
  mimeType: string,
  attachmentType: AttachmentType,
): Promise<UploadResult> {
  // Validate file size before making API call
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AttachmentUploadError(
      `File ${file.name} exceeds the maximum size of 10MB`,
      file.name,
    );
  }

  // Step 1: Get presigned URL from the API
  let presignResponse: PresignResponse;
  try {
    presignResponse = await client.post<PresignResponse>("/storage/presign", {
      body: {
        contentType: mimeType,
        size: file.size,
      },
    });
  } catch (error) {
    // Check for storage not configured error (503)
    if (error instanceof Error && error.message.includes("503")) {
      throw new AttachmentUploadError(
        "File uploads require storage configuration. Please configure S3 storage.",
        file.name,
        error,
      );
    }
    // Check for validation errors (400) - likely file size exceeded
    if (error instanceof Error && error.message.includes("400")) {
      throw new AttachmentUploadError(
        `File ${file.name} exceeds the maximum size of 10MB`,
        file.name,
        error,
      );
    }
    throw new AttachmentUploadError(
      `Failed to get upload URL for ${file.name}`,
      file.name,
      error,
    );
  }

  // Step 2: Upload file directly to S3 using the presigned URL
  try {
    const uploadResponse = await fetch(presignResponse.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }
  } catch (error) {
    throw new AttachmentUploadError(
      `Failed to upload ${file.name} to storage`,
      file.name,
      error,
    );
  }

  // Step 3: Return the upload result
  return {
    attachmentUri: presignResponse.attachmentUri,
    filename: file.name,
    mimeType,
    attachmentType,
  };
}
