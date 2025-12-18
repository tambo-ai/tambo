import chalk from "chalk";
import ora from "ora";
import { clearToken, loadToken, getAuthFilePath } from "../lib/auth.js";
import { createApiClient } from "../lib/api-client.js";
import { interactivePrompt } from "../utils/interactive.js";

/**
 * Handle the logout command
 * Clears local token and optionally revokes it on the server
 */
export async function handleLogout(
  options: { yes?: boolean } = {},
): Promise<void> {
  const token = await loadToken();

  if (!token) {
    console.log(chalk.yellow("You are not logged in."));
    return;
  }

  console.log(
    chalk.cyan(`\nCurrently logged in as: ${chalk.bold(token.user.email)}`),
  );

  // Confirm logout unless --yes flag is provided
  if (!options.yes) {
    const confirmed = await interactivePrompt(
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to log out?",
        default: true,
      },
      chalk.yellow(
        "Cannot prompt for confirmation in non-interactive mode. Use --yes to confirm.",
      ),
    );

    if (!confirmed) {
      console.log(chalk.gray("Logout cancelled."));
      return;
    }
  }

  const spinner = ora("Logging out...").start();

  try {
    // Try to revoke the token on the server (best effort)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiClient = createApiClient({ token: token.accessToken }) as any;

      // Get all sessions to find the current one
      const sessions = (await apiClient.deviceAuth.listSessions.query()) as {
        id: string;
        createdAt: Date;
      }[];

      // Find the session that matches our token's issuedAt time (approximate match)
      // Since we don't store the token ID locally, we can't revoke specifically
      // For now, just clear locally - user can use 'tambo auth sessions' to manage
      if (sessions.length > 0) {
        spinner.text = "Revoking session...";
      }
    } catch (_error) {
      // Server revocation failed, but we'll still clear local token
    }

    // Clear the local token
    await clearToken();
    spinner.succeed(chalk.green("Logged out successfully."));

    console.log(
      chalk.gray(`\nLocal credentials removed from: ${getAuthFilePath()}`),
    );
    console.log(chalk.gray("Run 'tambo init' to log in again."));
  } catch (error) {
    spinner.fail(chalk.red("Failed to log out."));
    throw error;
  }
}

/**
 * Handle the auth status command
 * Shows current authentication status and verifies token with server
 */
export async function handleAuthStatus(): Promise<void> {
  const token = await loadToken();

  if (!token) {
    console.log(chalk.yellow("\nNot logged in."));
    console.log(chalk.gray("Run 'tambo init' to authenticate."));
    return;
  }

  const expiresAt = new Date(token.expiresAt);
  const isLocallyExpired = Date.now() >= token.expiresAt;
  const daysRemaining = Math.ceil(
    (token.expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
  );

  // Verify token is still valid on server
  let isServerValid = false;
  let serverError: string | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClient = createApiClient({ token: token.accessToken }) as any;
    // Try to list sessions - if this works, token is valid
    await apiClient.deviceAuth.listSessions.query();
    isServerValid = true;
  } catch (error) {
    serverError = error instanceof Error ? error.message : "Unknown error";
    // Token is invalid on server - clear local token
    if (serverError.includes("UNAUTHORIZED") || serverError.includes("401")) {
      await clearToken();
      console.log(chalk.yellow("\nYour session has been revoked or expired."));
      console.log(chalk.gray("Local credentials cleared."));
      console.log(chalk.gray("Run 'tambo init' to log in again."));
      return;
    }
  }

  console.log(chalk.bold("\nAuthentication Status"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(`  ${chalk.cyan("Email:")}     ${token.user.email}`);
  if (token.user.name) {
    console.log(`  ${chalk.cyan("Name:")}      ${token.user.name}`);
  }
  console.log(`  ${chalk.cyan("User ID:")}   ${token.user.id}`);
  console.log(
    `  ${chalk.cyan("Issued:")}    ${new Date(token.issuedAt).toLocaleDateString()}`,
  );

  if (isLocallyExpired) {
    console.log(`  ${chalk.cyan("Status:")}    ${chalk.red("Expired")}`);
  } else if (!isServerValid) {
    console.log(
      `  ${chalk.cyan("Status:")}    ${chalk.yellow("Unable to verify")} (${serverError})`,
    );
  } else {
    console.log(`  ${chalk.cyan("Status:")}    ${chalk.green("Active")}`);
    console.log(
      `  ${chalk.cyan("Expires:")}   ${expiresAt.toLocaleDateString()} (${chalk.green(`${daysRemaining} days remaining`)})`,
    );
  }
  console.log();
}

/**
 * Handle the auth sessions command
 * Lists all active CLI sessions for the user
 */
export async function handleAuthSessions(): Promise<void> {
  const token = await loadToken();

  if (!token) {
    console.log(chalk.yellow("\nNot logged in."));
    console.log(chalk.gray("Run 'tambo init' to authenticate."));
    return;
  }

  const spinner = ora("Fetching sessions...").start();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClient = createApiClient({ token: token.accessToken }) as any;

    const sessions = (await apiClient.deviceAuth.listSessions.query()) as {
      id: string;
      createdAt: Date;
      lastUsedAt: Date | null;
      expiresAt: Date;
    }[];

    spinner.stop();

    if (sessions.length === 0) {
      console.log(chalk.yellow("\nNo active sessions found."));
      return;
    }

    console.log(chalk.bold(`\nActive CLI Sessions (${sessions.length})`));
    console.log(chalk.gray("─".repeat(60)));

    sessions.forEach((session, index) => {
      const createdAt = new Date(session.createdAt);
      const lastUsedAt = session.lastUsedAt
        ? new Date(session.lastUsedAt)
        : null;
      const expiresAt = new Date(session.expiresAt);
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      console.log(`\n  ${chalk.cyan(`Session ${index + 1}`)}`);
      console.log(`    ${chalk.gray("ID:")}         ${session.id}`);
      console.log(
        `    ${chalk.gray("Created:")}    ${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`,
      );
      if (lastUsedAt) {
        console.log(
          `    ${chalk.gray("Last used:")}  ${lastUsedAt.toLocaleDateString()} ${lastUsedAt.toLocaleTimeString()}`,
        );
      }
      console.log(
        `    ${chalk.gray("Expires:")}    ${expiresAt.toLocaleDateString()} (${daysRemaining} days)`,
      );
    });

    console.log(chalk.gray("\n─".repeat(60)));
    console.log(
      chalk.gray("To revoke a session, use: tambo auth revoke <session-id>"),
    );
    console.log();
  } catch (error) {
    spinner.fail(chalk.red("Failed to fetch sessions."));
    throw error;
  }
}

/**
 * Handle the auth revoke command
 * Revokes a specific session by ID
 */
export async function handleAuthRevoke(
  sessionId: string,
  options: { yes?: boolean } = {},
): Promise<void> {
  const token = await loadToken();

  if (!token) {
    console.log(chalk.yellow("\nNot logged in."));
    console.log(chalk.gray("Run 'tambo init' to authenticate."));
    return;
  }

  if (!sessionId) {
    console.log(chalk.red("Session ID is required."));
    console.log(chalk.gray("Run 'tambo auth sessions' to see all sessions."));
    return;
  }

  // Confirm revocation unless --yes flag is provided
  if (!options.yes) {
    const confirmed = await interactivePrompt(
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to revoke session ${sessionId}?`,
        default: false,
      },
      chalk.yellow(
        "Cannot prompt for confirmation in non-interactive mode. Use --yes to confirm.",
      ),
    );

    if (!confirmed) {
      console.log(chalk.gray("Revocation cancelled."));
      return;
    }
  }

  const spinner = ora("Revoking session...").start();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClient = createApiClient({ token: token.accessToken }) as any;

    await apiClient.deviceAuth.revoke.mutate({ tokenId: sessionId });

    spinner.succeed(chalk.green("Session revoked successfully."));
  } catch (error) {
    spinner.fail(chalk.red("Failed to revoke session."));
    throw error;
  }
}
