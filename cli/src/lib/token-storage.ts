import envPaths from "env-paths";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";

/**
 * Token data structure stored on disk
 */
export interface StoredToken {
  /** The session token for API authentication */
  sessionToken: string;
  /** When the token expires (ISO string) */
  expiresAt: string;
  /** User information */
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
  /** When the token was stored (ISO string) */
  storedAt: string;
}

/**
 * Get OS-specific paths for tambo data storage
 * Uses XDG Base Directory Specification on Linux
 *
 * Data paths (for auth tokens and persistent data):
 * - macOS: ~/Library/Application Support/tambo/
 * - Linux: ~/.local/share/tambo/ (or XDG_DATA_HOME)
 * - Windows: %LOCALAPPDATA%/tambo/
 */
const paths = envPaths("tambo", { suffix: "" });

/**
 * Path to the auth token file
 */
const AUTH_FILE_NAME = "auth.json";

function getAuthFilePath(): string {
  return join(paths.data, AUTH_FILE_NAME);
}

/**
 * Ensure the data directory exists with appropriate permissions
 */
function ensureDataDir(): void {
  const dataDir = paths.data;
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Set strict file permissions (Unix only)
 * Owner read/write only (0600)
 */
function setStrictPermissions(filePath: string): void {
  if (process.platform !== "win32") {
    chmodSync(filePath, 0o600);
  }
}

/**
 * Save authentication token to disk
 *
 * @param token - Token data to save
 */
export async function saveToken(token: StoredToken): Promise<void> {
  ensureDataDir();
  const filePath = getAuthFilePath();

  const data = JSON.stringify(token, null, 2);
  writeFileSync(filePath, data, { encoding: "utf-8", mode: 0o600 });

  // Ensure permissions are set correctly even if file existed
  setStrictPermissions(filePath);
}

/**
 * Load authentication token from disk
 *
 * @returns Token data or null if not found/invalid
 */
export function loadToken(): StoredToken | null {
  const filePath = getAuthFilePath();

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const data = readFileSync(filePath, { encoding: "utf-8" });
    const token = JSON.parse(data) as StoredToken;

    // Validate required fields
    if (!token.sessionToken || !token.expiresAt || !token.user) {
      return null;
    }

    return token;
  } catch {
    // Invalid JSON or read error
    return null;
  }
}

/**
 * Check if the stored token is still valid (not expired)
 *
 * @returns true if token exists and is not expired
 */
export function isTokenValid(): boolean {
  const token = loadToken();
  if (!token) {
    return false;
  }

  const expiresAt = new Date(token.expiresAt);
  const now = new Date();

  // Add a 5-minute buffer to avoid edge cases
  const bufferMs = 5 * 60 * 1000;
  return expiresAt.getTime() - bufferMs > now.getTime();
}

/**
 * Get the current session token if valid
 *
 * @returns Session token or null if not authenticated
 */
export function getSessionToken(): string | null {
  if (!isTokenValid()) {
    return null;
  }

  const token = loadToken();
  return token?.sessionToken ?? null;
}

/**
 * Get the current user info if authenticated
 *
 * @returns User info or null if not authenticated
 */
export function getCurrentUser(): StoredToken["user"] | null {
  if (!isTokenValid()) {
    return null;
  }

  const token = loadToken();
  return token?.user ?? null;
}

/**
 * Clear stored authentication token
 * Used for logout or when token is revoked
 */
export function clearToken(): void {
  const filePath = getAuthFilePath();

  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

/**
 * Check if there is any stored token (regardless of validity)
 */
export function hasStoredToken(): boolean {
  return existsSync(getAuthFilePath());
}

/**
 * Get the path where tokens are stored (for debugging/display)
 */
export function getTokenStoragePath(): string {
  return getAuthFilePath();
}

/**
 * Environment variable override for CI/testing
 * If TAMBO_TOKEN is set, it takes precedence over stored token
 */
export function getEffectiveSessionToken(): string | null {
  const envToken = process.env.TAMBO_TOKEN;
  if (envToken) {
    return envToken;
  }

  return getSessionToken();
}
