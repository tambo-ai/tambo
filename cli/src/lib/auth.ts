import fs from "fs";
import path from "path";
import os from "os";

export interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  tokenType: "Bearer";
  user: {
    id: string;
    email: string;
    name?: string;
  };
  issuedAt: number; // Unix timestamp in milliseconds
}

/**
 * Get the auth file path based on the platform
 * Returns OS-specific config directory path:
 * - macOS: ~/Library/Application Support/Tambo/auth.json
 * - Windows: %APPDATA%\Tambo\auth.json
 * - Linux: ~/.config/tambo/auth.json
 */
export function getAuthFilePath(): string {
  const platform = os.platform();

  if (platform === "darwin") {
    // macOS
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Tambo",
      "auth.json",
    );
  }

  if (platform === "win32") {
    // Windows
    const appData =
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Tambo", "auth.json");
  }

  // Linux and other Unix-like systems
  const configHome =
    process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configHome, "tambo", "auth.json");
}

/**
 * Save token data to the auth file
 * Creates directory if it doesn't exist
 * Sets file permissions to 0600 on Unix systems
 */
export async function saveToken(data: TokenData): Promise<void> {
  const authFilePath = getAuthFilePath();
  const authDir = path.dirname(authFilePath);

  // Create directory if it doesn't exist
  await fs.promises.mkdir(authDir, { recursive: true });

  // Write token data
  await fs.promises.writeFile(
    authFilePath,
    JSON.stringify(data, null, 2),
    "utf8",
  );

  // Set strict file permissions on Unix systems (owner read/write only)
  if (os.platform() !== "win32") {
    await fs.promises.chmod(authFilePath, 0o600);
  }
}

/**
 * Load token data from the auth file
 * Returns null if file doesn't exist or is invalid
 */
export async function loadToken(): Promise<TokenData | null> {
  const authFilePath = getAuthFilePath();

  try {
    const content = await fs.promises.readFile(authFilePath, "utf8");
    const data = JSON.parse(content) as TokenData;

    // Validate required fields
    if (
      !data.accessToken ||
      !data.expiresAt ||
      !data.tokenType ||
      !data.user?.id ||
      !data.user?.email
    ) {
      return null;
    }

    return data;
  } catch (_error) {
    // File doesn't exist or invalid JSON
    return null;
  }
}

/**
 * Clear the stored token by deleting the auth file
 */
export async function clearToken(): Promise<void> {
  const authFilePath = getAuthFilePath();

  try {
    await fs.promises.unlink(authFilePath);
  } catch (_error) {
    // File doesn't exist, nothing to do
  }
}

/**
 * Check if a token is expired
 * Returns true if the token is expired, false otherwise
 */
export function isTokenExpired(data: TokenData): boolean {
  return Date.now() >= data.expiresAt;
}

/**
 * Get a valid token, checking environment variable override first
 * Returns token string if valid, throws error otherwise
 * @throws Error if no valid token is available
 */
export async function getValidToken(): Promise<string> {
  // Check for environment variable override (useful for CI/testing)
  const envToken = process.env.TAMBO_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Load token from file
  const tokenData = await loadToken();
  if (!tokenData) {
    throw new Error(
      "No authentication token found. Please run 'tambo init' to authenticate.",
    );
  }

  // Check if token is expired
  if (isTokenExpired(tokenData)) {
    throw new Error(
      "Authentication token has expired. Please run 'tambo init' to re-authenticate.",
    );
  }

  return tokenData.accessToken;
}
