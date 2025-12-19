import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "fs";
import { dirname } from "path";
import { z } from "zod";
import { getAuthStatePath } from "../paths/xdg";

/**
 * Schema for auth state stored on disk.
 */
const authStateSchema = z.object({
  /** Access token for API requests */
  accessToken: z.string().optional(),
  /** Refresh token for obtaining new access tokens */
  refreshToken: z.string().optional(),
  /** Unix timestamp when the access token expires */
  expiresAt: z.number().optional(),
  /** Authenticated user information */
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string().optional(),
    })
    .optional(),
});

export type AuthState = z.infer<typeof authStateSchema>;

/**
 * Load auth state from user data directory.
 * Returns null if no auth state exists or if it's invalid.
 */
export function loadAuthState(): AuthState | null {
  const path = getAuthStatePath();

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, "utf-8");
    const data = JSON.parse(content);
    return authStateSchema.parse(data);
  } catch {
    // Corrupted or invalid auth state - treat as not authenticated
    return null;
  }
}

/**
 * Save auth state to user data directory.
 * Creates the directory with secure permissions if it doesn't exist.
 */
export function saveAuthState(state: AuthState): void {
  const path = getAuthStatePath();
  const dir = dirname(path);

  if (!existsSync(dir)) {
    // Create directory with secure permissions (owner-only access)
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  // Validate before saving
  const validated = authStateSchema.parse(state);

  // Write with secure permissions (owner read/write only)
  writeFileSync(path, JSON.stringify(validated, null, 2), { mode: 0o600 });
}

/**
 * Clear auth state (logout).
 */
export function clearAuthState(): void {
  const path = getAuthStatePath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

/**
 * Check if user is authenticated with a valid (non-expired) token.
 */
export function isAuthenticated(): boolean {
  const state = loadAuthState();

  if (!state?.accessToken) {
    return false;
  }

  // Check if token is expired
  if (state.expiresAt && Date.now() > state.expiresAt * 1000) {
    return false;
  }

  return true;
}

/**
 * Get the current user from auth state.
 * Returns null if not authenticated.
 */
export function getCurrentUser(): AuthState["user"] | null {
  const state = loadAuthState();
  return state?.user ?? null;
}

/**
 * Get the access token if authenticated and not expired.
 * Returns null if not authenticated or token is expired.
 */
export function getAccessToken(): string | null {
  if (!isAuthenticated()) {
    return null;
  }

  const state = loadAuthState();
  return state?.accessToken ?? null;
}
