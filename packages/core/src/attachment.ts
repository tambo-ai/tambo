import { createHmac } from "crypto";
import { ATTACHMENT_PREFIX } from "./shared-constants";

/**
 * Length of the unique attachment ID (using nanoid alphabet).
 * 10 characters with base62 gives ~8e17 combinations - sufficient for uniqueness within a project.
 */
export const ATTACHMENT_ID_LENGTH = 10;

/**
 * Length of the HMAC signature suffix appended to S3 keys.
 * 8 hex characters = 32 bits, enough to prevent guessing while keeping keys short.
 */
const SIGNATURE_LENGTH = 8;

/**
 * Regex pattern for validating unique IDs.
 * Must be exactly ATTACHMENT_ID_LENGTH base62 characters.
 */
const UNIQUE_ID_PATTERN = new RegExp(`^[A-Za-z0-9]{${ATTACHMENT_ID_LENGTH}}$`);

/**
 * Generate an HMAC signature for an attachment path.
 * Used to create S3 keys that can't be guessed from the public attachment URI.
 *
 * @param path - The path to sign (e.g., "projectId/uniqueId")
 * @param secret - The signing secret (API_KEY_SECRET)
 * @returns Short hex signature
 */
export function signAttachmentPath(path: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(path)
    .digest("hex")
    .slice(0, SIGNATURE_LENGTH);
}

/**
 * Build the S3 storage key from an attachment path and secret.
 * The key includes a signature suffix to prevent path guessing.
 *
 * @param projectId - The project ID
 * @param uniqueId - The unique attachment ID
 * @param secret - The signing secret
 * @returns S3 key in format: {projectId}/{uniqueId}-{signature}
 */
export function buildStorageKey(
  projectId: string,
  uniqueId: string,
  secret: string,
): string {
  const path = `${projectId}/${uniqueId}`;
  const signature = signAttachmentPath(path, secret);
  return `${path}-${signature}`;
}

/**
 * Build the public attachment URI (without signature).
 *
 * @param projectId - The project ID
 * @param uniqueId - The unique attachment ID
 * @returns Attachment URI in format: attachment://{projectId}/{uniqueId}
 */
export function buildAttachmentUri(
  projectId: string,
  uniqueId: string,
): string {
  return `${ATTACHMENT_PREFIX}${projectId}/${uniqueId}`;
}

/**
 * Parse an attachment URI and reconstruct the S3 storage key.
 *
 * @param uri - The attachment URI (e.g., "attachment://projectId/uniqueId")
 * @param secret - The signing secret
 * @returns Object with parsed components and reconstructed storage key
 * @throws Error if URI format is invalid
 */
export function parseAttachmentUri(
  uri: string,
  secret: string,
): {
  projectId: string;
  uniqueId: string;
  storageKey: string;
} {
  if (!uri.startsWith(ATTACHMENT_PREFIX)) {
    throw new Error(
      `Invalid attachment URI: ${uri}. Must start with "${ATTACHMENT_PREFIX}"`,
    );
  }

  const path = uri.slice(ATTACHMENT_PREFIX.length);
  if (!path.trim()) {
    throw new Error(`Invalid attachment URI: ${uri}. Missing path.`);
  }

  // Reject suspicious characters
  if (path.includes("\\") || path.includes("//")) {
    throw new Error(
      `Invalid attachment URI: ${uri}. Contains invalid characters.`,
    );
  }

  const slashIndex = path.indexOf("/");
  if (slashIndex === -1 || slashIndex === 0 || slashIndex === path.length - 1) {
    throw new Error(
      `Invalid attachment URI: ${uri}. Expected format: attachment://{projectId}/{uniqueId}`,
    );
  }

  const projectId = path.slice(0, slashIndex);
  const uniqueId = path.slice(slashIndex + 1);

  if (!projectId || !uniqueId) {
    throw new Error(
      `Invalid attachment URI: ${uri}. Missing projectId or uniqueId.`,
    );
  }

  // Validate uniqueId is exactly 10 base62 characters (no extra path segments)
  if (!UNIQUE_ID_PATTERN.test(uniqueId)) {
    throw new Error(
      `Invalid attachment URI: ${uri}. uniqueId must be exactly ${ATTACHMENT_ID_LENGTH} alphanumeric characters.`,
    );
  }

  const storageKey = buildStorageKey(projectId, uniqueId, secret);

  return { projectId, uniqueId, storageKey };
}
