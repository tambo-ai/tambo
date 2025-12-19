import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import Table from "cli-table3";
import { formatDistanceToNow } from "date-fns";
import ora from "ora";
import {
  api,
  ApiError,
  getApiBaseUrl,
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

export interface AuthSessionsOptions {
  revoke?: string;
  revokeAll?: boolean;
}

/**
 * Show current authentication status
 */
export async function handleAuthStatus(
  options: AuthStatusOptions,
): Promise<void> {
  const hasToken = hasStoredToken();
  const tokenData = loadToken();
  const user = getCurrentUser();

  // Quick local check first
  if (!hasToken || !isTokenValid()) {
    if (options.quiet) {
      process.exit(1);
      return;
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
    return;
  }

  // Verify with server to ensure sync
  const spinner = options.quiet ? null : ora("Verifying session...").start();
  const isValid = await verifySession();
  spinner?.stop();

  if (options.quiet) {
    process.exit(isValid ? 0 : 1);
    return;
  }

  console.log(chalk.bold("\n🔐 Authentication Status\n"));

  if (!isValid) {
    console.log(chalk.red("Session revoked or expired."));
    console.log(
      chalk.gray(
        `\nRun ${chalk.cyan("tambo auth login")} to re-authenticate.\n`,
      ),
    );
    return;
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
  console.log(chalk.gray(`  API endpoint: ${chalk.dim(getApiBaseUrl())}`));
  console.log();
}

/**
 * Login via device auth flow
 */
export async function handleAuthLogin(): Promise<void> {
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
      return;
    }
  }

  try {
    await runDeviceAuthFlow();
    console.log(chalk.green("\n✓ Successfully authenticated!\n"));
  } catch (error) {
    console.log(chalk.red("\n✗ Authentication failed.\n"));
    if (error instanceof Error) {
      console.log(chalk.gray(`  ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * Logout and clear stored credentials
 */
export async function handleAuthLogout(
  options: AuthLogoutOptions,
): Promise<void> {
  console.log(chalk.bold("\n🔐 Logout from tambo\n"));

  if (!hasStoredToken()) {
    console.log(chalk.yellow("Not currently authenticated."));
    console.log();
    return;
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
      return;
    }
  }

  clearToken();
  console.log(chalk.green("\n✓ Successfully logged out.\n"));
}

/**
 * List and manage CLI sessions
 */
export async function handleAuthSessions(
  options: AuthSessionsOptions,
): Promise<void> {
  // Check authentication first
  if (!hasStoredToken() || !isTokenValid()) {
    console.log(chalk.yellow("\nNot authenticated."));
    console.log(
      chalk.gray(
        `Run ${chalk.cyan("tambo auth login")} to authenticate first.\n`,
      ),
    );
    process.exit(1);
    return;
  }

  // Handle revoke by session ID
  if (options.revoke) {
    await revokeSessionById(options.revoke);
    return;
  }

  // Handle revoke all
  if (options.revokeAll) {
    await revokeAllSessions();
    return;
  }

  // List sessions
  await listSessions();
}

async function listSessions(): Promise<void> {
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
      return;
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
      const expiresAt = session.notAfter ? new Date(session.notAfter) : null;

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
        `To revoke a session: ${chalk.cyan("tambo auth sessions --revoke <session-id>")}`,
      ),
    );
    console.log(
      chalk.gray(
        `To revoke all sessions: ${chalk.cyan("tambo auth sessions --revoke-all")}\n`,
      ),
    );
  } catch (error) {
    spinner.fail("Failed to fetch sessions");

    if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    process.exit(1);
  }
}

async function revokeSessionById(sessionId: string): Promise<void> {
  console.log(chalk.bold("\n🗑️  Revoke Session\n"));

  const spinner = ora("Revoking session...").start();

  try {
    await api.deviceAuth.revokeSession.mutate({ sessionId });
    spinner.succeed("Session revoked successfully");
    console.log();
  } catch (error) {
    spinner.fail("Failed to revoke session");

    if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    process.exit(1);
  }
}

async function revokeAllSessions(): Promise<void> {
  console.log(chalk.bold("\n🗑️  Revoke All Sessions\n"));

  // Confirm before revoking all
  const shouldRevoke = await confirm({
    message:
      "This will revoke ALL CLI sessions including this one. You will need to re-authenticate. Continue?",
    default: false,
  });

  if (!shouldRevoke) {
    console.log(chalk.gray("\nCancelled.\n"));
    return;
  }

  const spinner = ora("Fetching sessions...").start();

  try {
    const sessions = await api.deviceAuth.listSessions.query();

    if (!sessions || sessions.length === 0) {
      spinner.info("No sessions to revoke");
      console.log();
      return;
    }

    spinner.text = `Revoking ${sessions.length} session(s)...`;

    for (const session of sessions) {
      await api.deviceAuth.revokeSession.mutate({ sessionId: session.id });
    }

    spinner.succeed(`Revoked ${sessions.length} session(s)`);

    // Clear local token since we revoked our own session
    clearToken();
    console.log(
      chalk.gray(
        `\nLocal credentials cleared. Run ${chalk.cyan("tambo auth login")} to re-authenticate.\n`,
      ),
    );
  } catch (error) {
    spinner.fail("Failed to revoke sessions");

    if (error instanceof ApiError) {
      console.log(chalk.red(`\nError: ${error.message}`));
    } else {
      console.log(chalk.red(`\nError: ${String(error)}`));
    }
    process.exit(1);
  }
}

/**
 * Main auth command handler - routes to subcommands
 */
export async function handleAuth(
  subcommand: string | undefined,
  flags: {
    quiet?: boolean;
    force?: boolean;
    revoke?: string;
    revokeAll?: boolean;
    help?: boolean;
  },
): Promise<void> {
  // No subcommand or 'status' - show status
  if (!subcommand || subcommand === "status") {
    await handleAuthStatus({ quiet: flags.quiet });
    return;
  }

  if (subcommand === "login") {
    await handleAuthLogin();
    return;
  }

  if (subcommand === "logout") {
    await handleAuthLogout({ force: flags.force });
    return;
  }

  if (subcommand === "sessions") {
    await handleAuthSessions({
      revoke: flags.revoke,
      revokeAll: flags.revokeAll,
    });
    return;
  }

  // Unknown subcommand
  console.log(chalk.red(`Unknown auth subcommand: ${subcommand}`));
  showAuthHelp();
  process.exit(1);
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
  ${chalk.yellow("status")}     Show current authentication status (default)
  ${chalk.yellow("login")}      Authenticate via browser
  ${chalk.yellow("logout")}     Clear stored credentials
  ${chalk.yellow("sessions")}   List and manage CLI sessions

${chalk.bold("Options")}
  ${chalk.yellow("--quiet, -q")}          Exit with code 0 if authenticated, 1 otherwise (status only)
  ${chalk.yellow("--force, -f")}          Skip confirmation prompts (logout only)
  ${chalk.yellow("--revoke <id>")}        Revoke a specific session (sessions only)
  ${chalk.yellow("--revoke-all")}         Revoke all CLI sessions (sessions only)

${chalk.bold("Examples")}
  $ ${chalk.cyan("tambo auth")}                       # Show auth status
  $ ${chalk.cyan("tambo auth status --quiet")}        # Check auth in scripts
  $ ${chalk.cyan("tambo auth login")}                 # Authenticate
  $ ${chalk.cyan("tambo auth logout")}                # Clear credentials
  $ ${chalk.cyan("tambo auth sessions")}              # List all CLI sessions
  $ ${chalk.cyan("tambo auth sessions --revoke-all")} # Revoke all sessions
`);
}
