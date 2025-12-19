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
  /** Base URL for the verification page (default: https://tambo.co) */
  baseUrl?: string;
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
  const {
    baseUrl = process.env.TAMBO_API_URL ?? "https://tambo.co",
    openBrowser = true,
    copyToClipboard = true,
  } = options;

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

  const { deviceCode, userCode, verificationUri, interval } = initResponse;
  const fullVerificationUrl = `${baseUrl}${verificationUri}?user_code=${userCode.replace("-", "")}`;

  // Step 2: Display instructions to user
  console.log(chalk.cyan("\n📱 Please authorize this device:\n"));
  console.log(
    chalk.white(`   Visit: ${chalk.bold(baseUrl + verificationUri)}`),
  );
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

  // Open browser
  if (openBrowser) {
    try {
      await open(fullVerificationUrl);
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

  const pollIntervalMs = (interval || 5) * 1000;
  const maxAttempts = 180; // 15 minutes at 5 second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(pollIntervalMs);
    attempts++;

    try {
      const pollResponse = await deviceAuth.poll(deviceCode);

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
      spinner.text = `Waiting for authorization... (${Math.floor((maxAttempts - attempts) * (pollIntervalMs / 1000 / 60))} min remaining)`;
    } catch (error) {
      if (error instanceof DeviceAuthError) {
        throw error;
      }

      if (error instanceof ApiError) {
        // Check for specific error codes
        if (error.code === "INVALID_DEVICE_CODE") {
          spinner.fail(chalk.red("Invalid device code"));
          throw new DeviceAuthError("Invalid device code", error.code);
        }

        // For other API errors, log but continue polling
        // (might be a temporary network issue)
        spinner.text = `Waiting for authorization... (retrying after error)`;
      }
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
