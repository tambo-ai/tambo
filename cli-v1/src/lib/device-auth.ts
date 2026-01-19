import chalk from "chalk";
import clipboard from "clipboardy";
import open from "open";
import ora from "ora";
import { api, ApiError } from "./api-client.js";
import { getSafeErrorMessage } from "../utils/error-helpers.js";
import { isInteractive } from "../utils/interactive.js";
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

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default polling interval in seconds if server doesn't specify */
const DEFAULT_POLL_INTERVAL_SECONDS = 5;

/** Maximum polling interval in milliseconds to avoid excessive delays */
const MAX_POLL_INTERVAL_MS = 30000;

/** Maximum attempts before timing out (15 minutes at 5 second intervals) */
const MAX_POLL_ATTEMPTS = 180;

/** Maximum consecutive errors before giving up */
const MAX_CONSECUTIVE_ERRORS = 5;

/** Backoff multiplier for rate limiting and errors */
const BACKOFF_MULTIPLIER = 1.5;

// ============================================================================
// DEVICE AUTH HELPERS - Break up the main flow for readability
// ============================================================================

interface DeviceAuthInitResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  interval: number;
}

interface PollState {
  pollIntervalMs: number;
  basePollInterval: number;
  attempts: number;
  consecutiveErrors: number;
  maxAttempts: number;
  maxConsecutiveErrors: number;
}

function createPollState(interval: number): PollState {
  const basePollInterval = (interval || DEFAULT_POLL_INTERVAL_SECONDS) * 1000;
  return {
    pollIntervalMs: basePollInterval,
    basePollInterval,
    attempts: 0,
    consecutiveErrors: 0,
    maxAttempts: MAX_POLL_ATTEMPTS,
    maxConsecutiveErrors: MAX_CONSECUTIVE_ERRORS,
  };
}

/**
 * Calculate the next poll interval with exponential backoff
 */
function calculateBackoffInterval(
  basePollInterval: number,
  errorCount: number,
): number {
  return Math.min(
    basePollInterval * Math.pow(BACKOFF_MULTIPLIER, errorCount),
    MAX_POLL_INTERVAL_MS,
  );
}

async function initiateDeviceAuth(): Promise<DeviceAuthInitResponse> {
  console.log(chalk.gray("\nInitiating device authentication..."));

  try {
    return await api.deviceAuth.initiate.mutate();
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DeviceAuthError(
        `Failed to initiate device auth: ${error.message}`,
        error.code,
      );
    }
    throw error;
  }
}

function displayAuthInstructions(
  userCode: string,
  verificationUri: string,
  verificationUriComplete: string,
): void {
  console.log(chalk.cyan("\n📱 Please authorize this device:\n"));
  console.log(chalk.white(`   Visit: ${chalk.bold(verificationUri)}`));
  console.log(chalk.white(`   Enter code: ${chalk.bold.green(userCode)}\n`));
  console.log(
    chalk.white(
      `   Or open directly: ${chalk.cyan(verificationUriComplete)}\n`,
    ),
  );
}

async function attemptClipboardAndBrowser(
  userCode: string,
  verificationUriComplete: string,
): Promise<void> {
  if (!isInteractive()) {
    console.log(
      chalk.gray(
        "   Running in non-interactive mode; not attempting to open a browser or copy to clipboard.\n",
      ),
    );
    return;
  }

  // Copy code to clipboard
  try {
    await clipboard.write(userCode);
    console.log(chalk.gray("   ✓ User code copied to clipboard!\n"));
  } catch {
    // Clipboard might not be available in all environments
  }

  // Open browser with pre-filled code URL
  try {
    await open(verificationUriComplete, { wait: false });
    console.log(chalk.gray("   Browser opened for authentication\n"));
  } catch {
    console.log(
      chalk.yellow(
        `   Could not open browser automatically. Please visit the URL above.\n`,
      ),
    );
  }
}

async function fetchUserAndSaveToken(
  sessionToken: string,
  expiresAt: string,
): Promise<DeviceAuthResult> {
  setInMemoryToken(sessionToken);

  const userSpinner = ora({
    text: "Fetching user info...",
    color: "cyan",
  }).start();

  try {
    const userInfo = await api.user.getUser.query();
    userSpinner.stop();

    const completeTokenData: StoredToken = {
      sessionToken,
      expiresAt,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      },
      storedAt: new Date().toISOString(),
    };

    await saveToken(completeTokenData);
    setInMemoryToken(null);

    return {
      sessionToken,
      user: completeTokenData.user,
    };
  } catch (userError) {
    userSpinner.fail(chalk.red("Failed to fetch user info"));
    setInMemoryToken(null);
    throw new DeviceAuthError(
      `Failed to fetch user info after authentication. Please try again. (${getSafeErrorMessage(userError)})`,
      "USER_INFO_FAILED",
    );
  }
}

function handleRateLimitError(
  state: PollState,
  spinner: ReturnType<typeof ora>,
): void {
  state.pollIntervalMs = Math.min(
    state.pollIntervalMs * BACKOFF_MULTIPLIER,
    MAX_POLL_INTERVAL_MS,
  );
  spinner.text = `Waiting for authorization... (slowing down)`;
}

function handleRetryableError(
  state: PollState,
  spinner: ReturnType<typeof ora>,
): void {
  state.consecutiveErrors++;

  if (state.consecutiveErrors >= state.maxConsecutiveErrors) {
    spinner.fail(chalk.red("Too many consecutive errors"));
    throw new DeviceAuthError(
      "Failed to connect to server after multiple attempts. Please check your network and try again.",
      "CONNECTION_ERROR",
    );
  }

  state.pollIntervalMs = calculateBackoffInterval(
    state.basePollInterval,
    state.consecutiveErrors,
  );
  spinner.text = `Waiting for authorization... (retrying after error, attempt ${state.consecutiveErrors}/${state.maxConsecutiveErrors})`;
}

function handleApiError(
  error: ApiError,
  state: PollState,
  spinner: ReturnType<typeof ora>,
): void {
  // Non-retryable client errors (4xx) - fail fast
  if (
    error.statusCode !== undefined &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    if (error.code === "INVALID_DEVICE_CODE" || error.statusCode === 404) {
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
      handleRateLimitError(state, spinner);
      return; // Continue polling
    }

    // Other 4xx errors - fail fast
    spinner.fail(chalk.red(`Server error: ${error.message}`));
    throw new DeviceAuthError(
      `Server rejected request: ${error.message}`,
      error.code,
    );
  }

  // Retryable errors (5xx, network) - backoff and retry
  handleRetryableError(state, spinner);
}

function handleUnknownError(
  state: PollState,
  spinner: ReturnType<typeof ora>,
): void {
  state.consecutiveErrors++;
  if (state.consecutiveErrors >= state.maxConsecutiveErrors) {
    spinner.fail(chalk.red("Connection lost"));
    throw new DeviceAuthError(
      "Lost connection to server. Please check your network and try again.",
      "CONNECTION_ERROR",
    );
  }
  state.pollIntervalMs = calculateBackoffInterval(
    state.basePollInterval,
    state.consecutiveErrors,
  );
  spinner.text = `Waiting for authorization... (connection issue, retrying)`;
}

// ============================================================================
// MAIN DEVICE AUTH FLOW
// ============================================================================

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
  const initResponse = await initiateDeviceAuth();
  const {
    deviceCode,
    userCode,
    verificationUri,
    verificationUriComplete,
    interval,
  } = initResponse;

  // Step 2: Display instructions and attempt to help user
  displayAuthInstructions(userCode, verificationUri, verificationUriComplete);
  await attemptClipboardAndBrowser(userCode, verificationUriComplete);

  // Step 3: Poll for completion
  const spinner = ora({
    text: "Waiting for authorization...",
    color: "cyan",
  }).start();
  const state = createPollState(interval);

  while (state.attempts < state.maxAttempts) {
    await sleep(state.pollIntervalMs);
    state.attempts++;

    try {
      const pollResponse = await api.deviceAuth.poll.query({ deviceCode });

      // Reset error count and interval on successful poll
      state.consecutiveErrors = 0;
      state.pollIntervalMs = state.basePollInterval;

      if (pollResponse.status === "complete") {
        spinner.succeed(chalk.green("Authentication successful!"));

        if (!pollResponse.sessionToken) {
          throw new DeviceAuthError(
            "Authentication completed but no session token received",
          );
        }

        if (!pollResponse.expiresAt) {
          throw new DeviceAuthError(
            "Something went wrong during authentication. Please try again.",
            "POLL_ERROR",
          );
        }

        // Step 4: Fetch user info and save token
        return await fetchUserAndSaveToken(
          pollResponse.sessionToken,
          pollResponse.expiresAt,
        );
      }

      if (pollResponse.status === "expired") {
        spinner.fail(chalk.red("Code expired"));
        throw new DeviceAuthError(
          "Device code expired. Please try again.",
          "CODE_EXPIRED",
        );
      }

      // Status is "pending", continue polling
      const minsRemaining = Math.floor(
        (state.maxAttempts - state.attempts) *
          (state.basePollInterval / 1000 / 60),
      );
      spinner.text = `Waiting for authorization... (${minsRemaining} min remaining)`;
    } catch (error) {
      if (error instanceof DeviceAuthError) {
        throw error;
      }

      if (error instanceof ApiError) {
        handleApiError(error, state, spinner);
        continue;
      }

      // Unknown error type - treat as retryable network error
      handleUnknownError(state, spinner);
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
