import chalk from "chalk";
import clipboard from "clipboardy";
import open from "open";
import ora from "ora";
import { api, ApiError } from "./api-client.js";
import {
  saveToken,
  setInMemoryToken,
  type StoredToken,
} from "./token-storage.js";

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
 * Sleep for a given number of milliseconds
 */
async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the device authentication flow
 *
 * 1. Calls api.deviceAuth.initiate to get device code and user code
 * 2. Displays the user code and opens browser to verification page
 * 3. Polls api.deviceAuth.poll until user verifies or code expires
 * 4. Saves the session token to disk
 *
 * @returns The auth result with session token and user info
 * @throws DeviceAuthError if auth fails
 */
export async function runDeviceAuthFlow(): Promise<DeviceAuthResult> {
  // Step 1: Initiate the device auth flow
  console.log(chalk.gray("\nInitiating device authentication..."));

  let initResponse;
  try {
    initResponse = await api.deviceAuth.initiate.mutate();
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
  try {
    await clipboard.write(userCode);
    console.log(chalk.gray("   ✓ User code copied to clipboard!\n"));
  } catch {
    // Clipboard might not be available in all environments
  }

  // Open browser with pre-filled code URL
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
      const pollResponse = await api.deviceAuth.poll.query({ deviceCode });

      // Reset error count and interval on successful poll
      consecutiveErrors = 0;
      pollIntervalMs = basePollInterval;

      if (pollResponse.status === "complete") {
        spinner.succeed(chalk.green("Authentication successful!"));

        if (!pollResponse.sessionToken) {
          throw new DeviceAuthError(
            "Authentication completed but no session token received",
          );
        }

        // Server guarantees expiresAt is present for completed polls (sessions have NOT NULL expiry)
        if (!pollResponse.expiresAt) {
          throw new DeviceAuthError(
            "Something went wrong during authentication. Please try again.",
            "POLL_ERROR",
          );
        }

        // Step 4a: Set in-memory token for the upcoming getUser request.
        // We don't persist to disk yet to avoid saving an incomplete token.
        setInMemoryToken(pollResponse.sessionToken);

        // Step 4b: Fetch user info using the new token (two-step auth flow)
        // The poll endpoint runs as 'anon' and can't access user data, so we
        // fetch it separately via an authenticated endpoint.
        const userSpinner = ora({
          text: "Fetching user info...",
          color: "cyan",
        }).start();

        try {
          const userInfo = await api.user.getUser.query();
          userSpinner.stop();

          // Step 4c: Save complete token to disk (only after we have user info)
          const completeTokenData: StoredToken = {
            sessionToken: pollResponse.sessionToken,
            expiresAt: pollResponse.expiresAt,
            user: {
              id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
            },
            storedAt: new Date().toISOString(),
          };

          await saveToken(completeTokenData);
          setInMemoryToken(null); // Clear in-memory token now that we've persisted

          return {
            sessionToken: pollResponse.sessionToken,
            user: completeTokenData.user,
          };
        } catch (userError) {
          userSpinner.fail(chalk.red("Failed to fetch user info"));
          setInMemoryToken(null); // Clear in-memory token on failure
          throw new DeviceAuthError(
            `Failed to fetch user info after authentication. Please try again. (${userError instanceof Error ? userError.message : String(userError)})`,
            "USER_INFO_FAILED",
          );
        }
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
