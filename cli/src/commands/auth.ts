import { confirm, select } from "@inquirer/prompts";
import chalk from "chalk";
import Table from "cli-table3";
import { formatDistanceToNow } from "date-fns";
import ora from "ora";
import type { Session } from "../lib/api-client.js";
import {
  api,
  ApiError,
  getConsoleBaseUrl,
  isAuthError,
  verifySession,
} from "../lib/api-client.js";
import { runDeviceAuthFlow } from "../lib/device-auth.js";
import {
  clearToken,
  getCurrentUser,
  getTokenStoragePath,
  hasStoredToken,
  isTokenValid,
  loadToken,
} from "../lib/token-storage.js";

export interface AuthStatusOptions {
  quiet?: boolean;
}

export interface AuthLogoutOptions {
  force?: boolean;
}

export interface AuthRevokeSessionOptions {
  all?: boolean;
}

// ============================================================================
// Common auth message helpers
// ============================================================================

function showNotAuthenticated(): void {
  console.log(chalk.yellow("\nNot authenticated."));
  console.log(
    chalk.gray(`\nRun ${chalk.cyan("tambo auth login")} to authenticate.\n`),
  );
}

function showSessionExpired(): void {
  clearToken();
  console.log(chalk.yellow("\nSession expired or revoked."));
  console.log(
    chalk.gray(
      `\nRun ${chalk.cyan("tambo auth login")} to authenticate again.\n`,
    ),
  );
}

// ============================================================================
// Auth command handlers
// ============================================================================

/**
 * Show current authentication status
 * @returns Exit code: 0 if authenticated, 1 otherwise
 */
export async function handleAuthStatus(
  options: AuthStatusOptions,
): Promise<number> {
  const hasToken = hasStoredToken();
  const tokenData = loadToken();
  const user = getCurrentUser();

  // Quick local check first
  if (!hasToken || !isTokenValid()) {
    if (options.quiet) {
      return 1;
    }

    console.log(chalk.bold("\n🔐 Authentication Status\n"));

    if (!hasToken) {
      console.log(chalk.yellow("Not authenticated."));
    } else {
      console.log(chalk.red("Session expired."));
    }

    console.log(
      chalk.gray(`\nRun ${chalk.cyan("tambo auth login")} to authenticate.\n`),
    );
    return 1;
  }

  // Verify with server to ensure sync
  const spinner = options.quiet ? null : ora("Verifying session...").start();
  const isValid = await verifySession();
  spinner?.stop();

  if (options.quiet) {
    return isValid ? 0 : 1;
  }

  console.log(chalk.bold("\n🔐 Authentication Status\n"));

  if (!isValid) {
    console.log(chalk.red("Session revoked or expired."));
    console.log(
      chalk.gray(
        `\nRun ${chalk.cyan("tambo auth login")} to re-authenticate.\n`,
      ),
    );
    return 1;
  }

  console.log(chalk.green("✓ Authenticated"));

  if (user) {
    console.log(chalk.gray(`  User: ${chalk.white(user.email ?? user.id)}`));
    if (user.name) {
      console.log(chalk.gray(`  Name: ${chalk.white(user.name)}`));
    }
  }

  if (tokenData?.expiresAt) {
    const expiresAt = new Date(tokenData.expiresAt);
    console.log(
      chalk.gray(
        `  Expires: ${chalk.white(formatDistanceToNow(expiresAt, { addSuffix: true }))}`,
      ),
    );
  }

  console.log(
    chalk.gray(`\n  Token stored at: ${chalk.dim(getTokenStoragePath())}`),
  );
  console.log(chalk.gray(`  API endpoint: ${chalk.dim(getConsoleBaseUrl())}`));
  console.log();
  return 0;
}

/**
 * Login via device auth flow
 * @returns Exit code: 0 on success, 1 on failure
 */
export async function handleAuthLogin(): Promise<number> {
  console.log(chalk.bold("\n🔐 Login to tambo\n"));

  // Check if already authenticated
  if (hasStoredToken() && isTokenValid()) {
    const user = getCurrentUser();
    console.log(
      chalk.yellow(
        `Already authenticated${user?.email ? ` as ${user.email}` : ""}.`,
      ),
    );

    const shouldReauth = await confirm({
      message: "Do you want to re-authenticate?",
      default: false,
    });

    if (!shouldReauth) {
      console.log(chalk.gray("\nKeeping existing session.\n"));
      return 0;
    }
  }

  try {
    await runDeviceAuthFlow();
    console.log(chalk.green("\n✓ Successfully authenticated!\n"));
    return 0;
  } catch (error) {
    console.log(chalk.red("\n✗ Authentication failed.\n"));
    if (error instanceof Error) {
      console.log(chalk.gray(`  ${error.message}\n`));
    }
    return 1;
  }
}

/**
 * Logout and clear stored credentials
 * @returns Exit code: 0 on success
 */
export async function handleAuthLogout(
  options: AuthLogoutOptions,
): Promise<number> {
  console.log(chalk.bold("\n🔐 Logout from tambo\n"));

  if (!hasStoredToken()) {
    console.log(chalk.yellow("Not currently authenticated."));
    console.log();
    return 0;
  }

  const user = getCurrentUser();
  const userLabel = user?.email ? ` (${user.email})` : "";

  if (!options.force) {
    const shouldLogout = await confirm({
      message: `Log out${userLabel}? This will clear your stored credentials.`,
      default: true,
    });

    if (!shouldLogout) {
      console.log(chalk.gray("\nCancelled.\n"));
      return 0;
    }
  }

  clearToken();
  console.log(chalk.green("\n✓ Successfully logged out.\n"));
  return 0;
}

/**
 * List CLI sessions
 * @returns Exit code: 0 on success, 1 on failure
 */
export async function handleAuthSessions(): Promise<number> {
  // Check authentication first
  if (!hasStoredToken() || !isTokenValid()) {
    showNotAuthenticated();
    return 1;
  }

  return await listSessions();
}

/**
 * Revoke CLI session(s)
 * @returns Exit code: 0 on success, 1 on failure
 */
export async function handleAuthRevokeSession(
  options: AuthRevokeSessionOptions,
): Promise<number> {
  // Check authentication first
  if (!hasStoredToken() || !isTokenValid()) {
    showNotAuthenticated();
    return 1;
  }

  if (options.all) {
    return await revokeAllSessions();
  }

  // Show interactive picker
  return await interactiveRevokeSession();
}

async function interactiveRevokeSession(): Promise<number> {
  const spinner = ora("Fetching sessions...").start();

  try {
    const sessions = await api.deviceAuth.listSessions.query();

    if (sessions.length === 0) {
      spinner.info("No active sessions found");
      console.log();
      return 0;
    }

    spinner.stop();

    const choices: { name: string; value: string }[] = sessions.map(
      (session: Session) => {
        const createdAt = new Date(session.createdAt);
        const label = `${session.id.slice(0, 16)}...  (created ${formatDistanceToNow(createdAt, { addSuffix: true })})`;
        return {
          name: label,
          value: session.id,
        };
      },
    );

    choices.push({
      name: chalk.gray("Cancel"),
      value: "__cancel__",
    });

    const selectedId = await select<string>({
      message: "Select a session to revoke:",
      choices,
    });

    if (selectedId === "__cancel__") {
      console.log(chalk.gray("\nCancelled.\n"));
      return 0;
    }

    return await revokeSessionById(selectedId);
  } catch (error) {
    spinner.fail("Failed to fetch sessions");

    if (isAuthError(error)) {
      showSessionExpired();
    } else if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    return 1;
  }
}

async function listSessions(): Promise<number> {
  console.log(chalk.bold("\n📱 CLI Sessions\n"));

  const spinner = ora("Fetching sessions...").start();

  try {
    const sessions = await api.deviceAuth.listSessions.query();

    spinner.stop();

    if (!sessions || sessions.length === 0) {
      console.log(chalk.gray("No active CLI sessions found."));
      console.log(
        chalk.gray(
          `\nSessions are created when you run ${chalk.cyan("tambo auth login")}.\n`,
        ),
      );
      return 0;
    }

    const table = new Table({
      head: [
        chalk.cyan("Session ID"),
        chalk.cyan("Created"),
        chalk.cyan("Expires"),
      ],
      chars: {
        top: "",
        "top-mid": "",
        "top-left": "",
        "top-right": "",
        bottom: "",
        "bottom-mid": "",
        "bottom-left": "",
        "bottom-right": "",
        left: "",
        "left-mid": "",
        mid: "",
        "mid-mid": "",
        right: "",
        "right-mid": "",
        middle: "│",
      },
      style: {
        head: [],
        border: ["gray"],
      },
    });

    for (const session of sessions) {
      const createdAt = new Date(session.createdAt);
      const expiresAt = session.expiresAt ? new Date(session.expiresAt) : null;

      table.push([
        session.id.slice(0, 16) + "...",
        formatDistanceToNow(createdAt, { addSuffix: true }),
        expiresAt
          ? formatDistanceToNow(expiresAt, { addSuffix: true })
          : "Never",
      ]);
    }

    console.log(table.toString());
    console.log(chalk.gray(`\nTotal: ${sessions.length} session(s)\n`));
    console.log(
      chalk.gray(
        `To revoke a session: ${chalk.cyan("tambo auth revoke-session")}`,
      ),
    );
    console.log(
      chalk.gray(
        `To revoke all sessions: ${chalk.cyan("tambo auth revoke-session --all")}\n`,
      ),
    );
    return 0;
  } catch (error) {
    spinner.fail("Failed to fetch sessions");

    if (isAuthError(error)) {
      showSessionExpired();
    } else if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    return 1;
  }
}

async function revokeSessionById(sessionId: string): Promise<number> {
  console.log(chalk.bold("\n🗑️  Revoke Session\n"));

  const spinner = ora("Revoking session...").start();

  try {
    await api.deviceAuth.revokeSession.mutate({ sessionId });
    spinner.succeed("Session revoked successfully");
    console.log();
    return 0;
  } catch (error) {
    spinner.fail("Failed to revoke session");

    if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    return 1;
  }
}

async function revokeAllSessions(): Promise<number> {
  console.log(chalk.bold("\n🗑️  Revoke All Sessions\n"));

  // Confirm before revoking all
  const shouldRevoke = await confirm({
    message:
      "This will revoke ALL CLI sessions including this one. You will need to re-authenticate. Continue?",
    default: false,
  });

  if (!shouldRevoke) {
    console.log(chalk.gray("\nCancelled.\n"));
    return 0;
  }

  const spinner = ora("Revoking all sessions...").start();

  try {
    const result = await api.deviceAuth.revokeAllSessions.mutate();

    if (result.revokedCount === 0) {
      spinner.info("No sessions to revoke");
      console.log();
      return 0;
    }

    spinner.succeed(`Revoked ${result.revokedCount} session(s)`);

    // Clear local token since we revoked our own session
    clearToken();
    console.log(
      chalk.gray(
        `\nLocal credentials cleared. Run ${chalk.cyan("tambo auth login")} to re-authenticate.\n`,
      ),
    );
    return 0;
  } catch (error) {
    spinner.fail("Failed to revoke sessions");

    if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    return 1;
  }
}

/**
 * Main auth command handler - routes to subcommands
 * Handles process.exit at this level based on subcommand exit codes
 */
export async function handleAuth(
  subcommand: string | undefined,
  flags: {
    quiet?: boolean;
    force?: boolean;
    all?: boolean;
    help?: boolean;
  },
): Promise<void> {
  let exitCode = 0;

  // No subcommand or 'status' - show status
  if (!subcommand || subcommand === "status") {
    exitCode = await handleAuthStatus({ quiet: flags.quiet });
  } else if (subcommand === "login") {
    exitCode = await handleAuthLogin();
  } else if (subcommand === "logout") {
    exitCode = await handleAuthLogout({ force: flags.force });
  } else if (subcommand === "sessions") {
    exitCode = await handleAuthSessions();
  } else if (subcommand === "revoke-session") {
    exitCode = await handleAuthRevokeSession({
      all: flags.all,
    });
  } else {
    // Unknown subcommand
    console.log(chalk.red(`Unknown auth subcommand: ${subcommand}`));
    showAuthHelp();
    exitCode = 1;
  }

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

/**
 * Show auth command help
 */
export function showAuthHelp(): void {
  console.log(`
${chalk.bold("tambo auth")} - Manage authentication

${chalk.bold("Usage")}
  $ ${chalk.cyan("tambo auth")} [subcommand] [options]

${chalk.bold("Subcommands")}
  ${chalk.yellow("status")}          Show current authentication status (default)
  ${chalk.yellow("login")}           Authenticate via browser
  ${chalk.yellow("logout")}          Clear stored credentials
  ${chalk.yellow("sessions")}        List active CLI sessions
  ${chalk.yellow("revoke-session")}  Revoke CLI session(s)

${chalk.bold("Options")}
  ${chalk.yellow("--quiet, -q")}     Exit with code 0 if authenticated, 1 otherwise (status only)
  ${chalk.yellow("--force, -f")}     Skip confirmation prompts (logout only)
  ${chalk.yellow("--all")}           Revoke all sessions (revoke-session only)

${chalk.bold("Examples")}
  $ ${chalk.cyan("tambo auth")}                            # Show auth status
  $ ${chalk.cyan("tambo auth status --quiet")}             # Check auth in scripts
  $ ${chalk.cyan("tambo auth login")}                      # Authenticate
  $ ${chalk.cyan("tambo auth logout")}                     # Clear credentials
  $ ${chalk.cyan("tambo auth sessions")}                   # List all CLI sessions
  $ ${chalk.cyan("tambo auth revoke-session")}             # Select session to revoke
  $ ${chalk.cyan("tambo auth revoke-session --all")}       # Revoke all sessions
`);
}
