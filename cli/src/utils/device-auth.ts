import chalk from "chalk";
import clipboard from "clipboardy";
import open from "open";
import ora from "ora";
import { createApiClient } from "../lib/api-client.js";
import { saveToken } from "../lib/auth.js";

export interface DeviceAuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Initiates and completes the device authorization flow
 * Returns the access token and user information on success
 * @throws Error if the device code expires or authentication fails
 */
export async function initiateDeviceAuth(): Promise<DeviceAuthResult> {
  // Step 1: Create unauthenticated API client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiClient = createApiClient() as any;

  // Step 2: Initiate device auth flow
  console.log(chalk.cyan("\nInitiating device authentication..."));

  const initResponse = (await apiClient.deviceAuth.initiate.mutate()) as {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
  };
  const { deviceCode, userCode, verificationUri, interval } = initResponse;

  // Step 3: Display user code and verification URL
  console.log(chalk.bold("\n📱 Please authorize this device:"));
  console.log(chalk.gray(`\n   Visit: ${chalk.cyan(verificationUri)}`));
  console.log(chalk.gray(`   Enter code: ${chalk.bold.yellow(userCode)}`));

  // Step 4: Copy user code to clipboard
  try {
    clipboard.writeSync(userCode);
    console.log(chalk.green("\n   ✓ User code copied to clipboard!"));
  } catch (error) {
    console.log(
      chalk.yellow(
        `\n   ⚠️  Failed to copy to clipboard: ${(error as Error).message}`,
      ),
    );
  }

  // Step 5: Open browser to verification URL with user_code query param
  const verificationUrl = `${verificationUri}?user_code=${encodeURIComponent(userCode)}`;
  try {
    await open(verificationUrl);
    console.log(chalk.gray("\n   Browser opened for authentication"));
  } catch (error) {
    console.log(
      chalk.yellow(
        `\n   ⚠️  Failed to open browser: ${(error as Error).message}`,
      ),
    );
    console.log(chalk.gray(`   Please visit manually: ${verificationUrl}`));
  }

  // Step 6: Start polling loop
  const spinner = ora({
    text: "Waiting for authorization...",
    color: "cyan",
  }).start();

  const pollInterval = (interval ?? 5) * 1000; // Convert to milliseconds
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes maximum (60 attempts * 5 seconds)

  while (attempts < maxAttempts) {
    attempts++;

    // Wait before polling
    await new Promise((resolve) => {
      setTimeout(resolve, pollInterval);
    });

    try {
      // Step 7: Poll for completion
      const pollResponse = (await apiClient.deviceAuth.poll.query({
        deviceCode,
      })) as {
        status: "pending" | "complete" | "expired";
        accessToken?: string;
        user?: { id: string; email: string; name?: string };
      };

      // Step 8: Handle response status
      if (pollResponse.status === "complete") {
        spinner.succeed(chalk.green("Authentication successful!"));

        // When status is "complete", accessToken and user are guaranteed
        const accessToken = pollResponse.accessToken!;
        const user = pollResponse.user!;

        // Extract token and user data
        const tokenData = {
          accessToken,
          expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
          tokenType: "Bearer" as const,
          user,
          issuedAt: Date.now(),
        };

        // Step 9: Save token securely
        await saveToken(tokenData);

        return {
          accessToken,
          user,
        };
      }

      if (pollResponse.status === "expired") {
        spinner.fail(chalk.red("Device code expired"));
        throw new Error(
          "Device code expired. Please run 'tambo init' again to re-authenticate.",
        );
      }

      // status === "pending", continue polling
    } catch (error) {
      spinner.fail(chalk.red("Authentication failed"));
      throw error;
    }
  }

  // Maximum attempts reached
  spinner.fail(chalk.red("Authentication timed out"));
  throw new Error(
    "Authentication timed out after 5 minutes. Please run 'tambo init' again.",
  );
}
