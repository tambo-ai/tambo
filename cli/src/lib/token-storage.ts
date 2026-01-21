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
 * Name of directory to store state/config/cache
 */
const DIR_PREFIX = "tambo";

/**
 * Explicit mapping of directory types to XDG environment variables.
 * Using explicit strings rather than dynamic construction for security
 * and to make these searchable in the codebase.
 */
const XDG_ENV_VARS = {
  cache: "XDG_CACHE_HOME",
  config: "XDG_CONFIG_HOME",
  data: "XDG_DATA_HOME",
} as const;

/**
 * Get OS-specific paths for tambo state storage
 * Uses XDG Base Directory Specification on Linux
 *
 * Data paths (for auth tokens and persistent data):
 * - macOS: ~/Library/Application Support/tambo/ (or $XDG_DATA_HOME/tambo/)
 * - Linux: ~/.local/share/tambo/ (or $XDG_DATA_HOME/tambo/)
 * - Windows: %LOCALAPPDATA%/tambo/
 */
function getDir(type: keyof typeof XDG_ENV_VARS): string {
  const envKey = XDG_ENV_VARS[type];
  const xdgDir = process.env[envKey];
  if (xdgDir) {
    return join(xdgDir, DIR_PREFIX);
  }
  const paths = envPaths(DIR_PREFIX, { suffix: "" });
  return paths[type];
}

/**
 * Path to the auth token file
 */
const AUTH_FILE_NAME = "auth.json";

function getAuthFilePath(): string {
  return join(getDir("data"), AUTH_FILE_NAME);
}

/**
 * Ensure the data directory exists with appropriate permissions
 */
function ensureDataDir(): void {
  const dataDir = getDir("data");
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

    // Validate basic structure (sessionToken, expiresAt, user object)
    if (!token.sessionToken || !token.expiresAt || !token.user) {
      console.warn(
        `Warning: Auth token file has invalid format. Run 'tambo auth login' to re-authenticate.`,
      );
      return null;
    }

    return token;
  } catch {
    // Invalid JSON or read error
    console.warn(
      `Warning: Could not read auth token file. Run 'tambo auth login' to re-authenticate.`,
    );
    return null;
  }
}

/**
 * Check if token has expired
 */
function isTokenExpired(token: StoredToken): boolean {
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  // Add a 5-minute buffer to avoid edge cases
  const bufferMs = 5 * 60 * 1000;
  return expiresAt.getTime() - bufferMs <= now.getTime();
}

/**
 * Check if the stored token is fully valid (not expired AND has user info)
 *
 * Use this to determine if the user is properly authenticated.
 * Returns false for incomplete tokens (e.g., during two-step auth bootstrap).
 *
 * @returns true if token exists, is not expired, and has complete user info
 */
export function isTokenValid(): boolean {
  const token = loadToken();
  if (!token) {
    return false;
  }

  // Check both expiry and completeness (user.id must be present)
  return !isTokenExpired(token) && !!token.user.id;
}

/**
 * Get the current session token if not expired
 *
 * Note: This returns the token even if user info is incomplete (e.g., during
 * the two-step auth bootstrap). Use isTokenValid() to check full validity.
 *
 * @returns Session token or null if not authenticated or expired
 */
export function getSessionToken(): string | null {
  const token = loadToken();
  if (!token || isTokenExpired(token)) {
    return null;
  }

  return token.sessionToken;
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
 * In-memory token for temporary use during auth flows.
 * Takes precedence over disk storage but below TAMBO_TOKEN env var.
 */
let inMemoryToken: string | null = null;

/**
 * Set an in-memory token for temporary use (e.g., during auth bootstrap).
 * This allows making authenticated requests without persisting incomplete tokens.
 */
export function setInMemoryToken(token: string | null): void {
  inMemoryToken = token;
}

/**
 * Environment variable override for CI/testing
 * Priority: TAMBO_TOKEN env var > in-memory token > stored token on disk
 */
export function getEffectiveSessionToken(): string | null {
  const envToken = process.env.TAMBO_TOKEN;
  if (envToken) {
    return envToken;
  }

  if (inMemoryToken) {
    return inMemoryToken;
  }

  return getSessionToken();
}
