import chalk from "chalk";
import clipboard from "clipboardy";
import open from "open";
import ora from "ora";
import { ApiError, deviceAuth } from "./api-client.js";
import { saveToken, type StoredToken } from "./token-storage.js";

/**
 * Result of a successful device auth flow
 */
export interface DeviceAuthResult {
  sessionToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
}

/**
 * Error thrown when device auth fails
 */
export class DeviceAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "DeviceAuthError";
  }
}

/**
 * Options for the device auth flow
 */
interface DeviceAuthOptions {
  /** Whether to automatically open the browser */
  openBrowser?: boolean;
  /** Whether to copy the code to clipboard */
  copyToClipboard?: boolean;
}

/**
 * Sleep for a given number of milliseconds
 */
async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the device authentication flow
 *
 * 1. Calls deviceAuth.initiate to get device code and user code
 * 2. Displays the user code and opens browser to verification page
 * 3. Polls deviceAuth.poll until user verifies or code expires
 * 4. Saves the session token to disk
 *
 * @returns The auth result with session token and user info
 * @throws DeviceAuthError if auth fails
 */
export async function runDeviceAuthFlow(
  options: DeviceAuthOptions = {},
): Promise<DeviceAuthResult> {
  const { openBrowser = true, copyToClipboard = true } = options;

  // Step 1: Initiate the device auth flow
  console.log(chalk.gray("\nInitiating device authentication..."));

  let initResponse;
  try {
    initResponse = await deviceAuth.initiate();
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DeviceAuthError(
        `Failed to initiate device auth: ${error.message}`,
        error.code,
      );
    }
    throw error;
  }

  const {
    deviceCode,
    userCode,
    verificationUri,
    verificationUriComplete,
    interval,
  } = initResponse;

  // Step 2: Display instructions to user
  console.log(chalk.cyan("\n📱 Please authorize this device:\n"));
  console.log(chalk.white(`   Visit: ${chalk.bold(verificationUri)}`));
  console.log(chalk.white(`   Enter code: ${chalk.bold.green(userCode)}\n`));

  // Copy code to clipboard
  if (copyToClipboard) {
    try {
      await clipboard.write(userCode);
      console.log(chalk.gray("   ✓ User code copied to clipboard!\n"));
    } catch {
      // Clipboard might not be available in all environments
    }
  }

  // Open browser with pre-filled code URL
  if (openBrowser) {
    try {
      await open(verificationUriComplete);
      console.log(chalk.gray("   Browser opened for authentication\n"));
    } catch {
      console.log(
        chalk.yellow(
          `   Could not open browser automatically. Please visit the URL above.\n`,
        ),
      );
    }
  }

  // Step 3: Poll for completion
  const spinner = ora({
    text: "Waiting for authorization...",
    color: "cyan",
  }).start();

  let pollIntervalMs = (interval || 5) * 1000;
  const basePollInterval = pollIntervalMs;
  const maxAttempts = 180; // 15 minutes at 5 second intervals
  const maxConsecutiveErrors = 5;
  let attempts = 0;
  let consecutiveErrors = 0;

  while (attempts < maxAttempts) {
    await sleep(pollIntervalMs);
    attempts++;

    try {
      const pollResponse = await deviceAuth.poll(deviceCode);

      // Reset error count and interval on successful poll
      consecutiveErrors = 0;
      pollIntervalMs = basePollInterval;

      if (pollResponse.status === "complete") {
        spinner.succeed(chalk.green("Authentication successful!"));

        if (!pollResponse.sessionToken || !pollResponse.user) {
          throw new DeviceAuthError(
            "Authentication completed but no session token received",
          );
        }

        // Step 4: Save token to disk
        const tokenData: StoredToken = {
          sessionToken: pollResponse.sessionToken,
          expiresAt: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 90 days
          user: {
            id: pollResponse.user.id,
            email: pollResponse.user.email,
            name: pollResponse.user.name,
          },
          storedAt: new Date().toISOString(),
        };

        await saveToken(tokenData);

        return {
          sessionToken: pollResponse.sessionToken,
          user: pollResponse.user,
        };
      }

      if (pollResponse.status === "expired") {
        spinner.fail(chalk.red("Code expired"));
        throw new DeviceAuthError(
          "Device code expired. Please try again.",
          "CODE_EXPIRED",
        );
      }

      // Status is "pending", continue polling
      spinner.text = `Waiting for authorization... (${Math.floor((maxAttempts - attempts) * (basePollInterval / 1000 / 60))} min remaining)`;
    } catch (error) {
      if (error instanceof DeviceAuthError) {
        throw error;
      }

      if (error instanceof ApiError) {
        // Non-retryable client errors (4xx) - fail fast
        if (
          error.statusCode !== undefined &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          // Specific error handling
          if (
            error.code === "INVALID_DEVICE_CODE" ||
            error.statusCode === 404
          ) {
            spinner.fail(chalk.red("Invalid device code"));
            throw new DeviceAuthError("Invalid device code", error.code);
          }

          if (error.statusCode === 401 || error.statusCode === 403) {
            spinner.fail(chalk.red("Authentication error"));
            throw new DeviceAuthError(
              "Authentication failed. Please check your configuration.",
              "AUTH_ERROR",
            );
          }

          // Rate limiting - slow down but continue
          if (
            error.statusCode === 429 ||
            error.code === "TOO_MANY_REQUESTS" ||
            error.message === "SLOW_DOWN"
          ) {
            pollIntervalMs = Math.min(pollIntervalMs * 1.5, 30000); // Cap at 30s
            spinner.text = `Waiting for authorization... (slowing down)`;
            continue;
          }

          // Other 4xx errors - fail fast
          spinner.fail(chalk.red(`Server error: ${error.message}`));
          throw new DeviceAuthError(
            `Server rejected request: ${error.message}`,
            error.code,
          );
        }

        // Retryable errors (5xx, network) - backoff and retry
        consecutiveErrors++;

        if (consecutiveErrors >= maxConsecutiveErrors) {
          spinner.fail(chalk.red("Too many consecutive errors"));
          throw new DeviceAuthError(
            "Failed to connect to server after multiple attempts. Please check your network and try again.",
            "CONNECTION_ERROR",
          );
        }

        // Exponential backoff for retryable errors
        pollIntervalMs = Math.min(
          basePollInterval * Math.pow(1.5, consecutiveErrors),
          30000,
        );
        spinner.text = `Waiting for authorization... (retrying after error, attempt ${consecutiveErrors}/${maxConsecutiveErrors})`;
        continue;
      }

      // Unknown error type - treat as retryable network error
      consecutiveErrors++;
      if (consecutiveErrors >= maxConsecutiveErrors) {
        spinner.fail(chalk.red("Connection lost"));
        throw new DeviceAuthError(
          "Lost connection to server. Please check your network and try again.",
          "CONNECTION_ERROR",
        );
      }
      pollIntervalMs = Math.min(
        basePollInterval * Math.pow(1.5, consecutiveErrors),
        30000,
      );
      spinner.text = `Waiting for authorization... (connection issue, retrying)`;
    }
  }

  spinner.fail(chalk.red("Authentication timed out"));
  throw new DeviceAuthError(
    "Authentication timed out. Please try again.",
    "TIMEOUT",
  );
}

/**
 * Check if user is already authenticated with a valid session (local check)
 */
export { clearToken, getCurrentUser, isTokenValid } from "./token-storage.js";

/**
 * Verify session with server - ensures local and server are in sync
 * Use this when you need to confirm the session is actually valid
 */
export { verifySession } from "./api-client.js";
