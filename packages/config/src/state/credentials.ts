import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "fs";
import { dirname } from "path";
import { z } from "zod";
import { getCredentialsPath } from "../paths/xdg";

/**
 * Schema for credentials stored on disk.
 * Following clig.dev: secrets stored in files with secure permissions.
 */
const credentialsSchema = z.object({
  /** Tambo API key */
  apiKey: z.string().optional(),
  /** Default project ID */
  projectId: z.string().optional(),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Load credentials from user data directory.
 * Returns null if no credentials exist or if they're invalid.
 */
export function loadCredentials(): Credentials | null {
  const path = getCredentialsPath();

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, "utf-8");
    const data = JSON.parse(content);
    return credentialsSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save credentials to user data directory.
 * Creates the directory with secure permissions if it doesn't exist.
 */
export function saveCredentials(creds: Credentials): void {
  const path = getCredentialsPath();
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const validated = credentialsSchema.parse(creds);
  writeFileSync(path, JSON.stringify(validated, null, 2), { mode: 0o600 });
}

/**
 * Clear credentials.
 */
export function clearCredentials(): void {
  const path = getCredentialsPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

/**
 * Get the stored API key.
 */
export function getStoredApiKey(): string | null {
  const creds = loadCredentials();
  return creds?.apiKey ?? null;
}

/**
 * Get the stored project ID.
 */
export function getStoredProjectId(): string | null {
  const creds = loadCredentials();
  return creds?.projectId ?? null;
}

/**
 * Set the API key in credentials.
 */
export function setApiKey(apiKey: string): void {
  const existing = loadCredentials() ?? {};
  saveCredentials({ ...existing, apiKey });
}

/**
 * Set the project ID in credentials.
 */
export function setProjectId(projectId: string): void {
  const existing = loadCredentials() ?? {};
  saveCredentials({ ...existing, projectId });
}
