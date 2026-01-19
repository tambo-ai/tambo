/**
 * Auth command - Manage authentication
 *
 * Non-interactive authentication management:
 * - Auto-confirms logout
 * - Provides verbose status output
 * - Suggests next commands
 */

import { defineCommand } from "citty";
import chalk from "chalk";
import { formatDistanceToNow } from "date-fns";
import ora from "ora";

import {
  api,
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

import { out, type CommandSuggestion } from "../utils/output.js";
import { getSafeErrorMessage } from "../utils/error-helpers.js";
import { isTTY } from "../utils/tty.js";

interface AuthResult {
  success: boolean;
  authenticated: boolean;
  user?: {
    email?: string;
    name?: string;
    id: string;
  };
  expiresAt?: string;
  tokenPath?: string;
  apiEndpoint?: string;
  sessions?: {
    id: string;
    createdAt: string;
    expiresAt?: string;
  }[];
  errors: string[];
  /** Suggested next commands for agents to consider */
  suggestedCommands?: CommandSuggestion[];
  /** Verification URL for device auth (only present with --no-wait) */
  verificationUrl?: string;
  /** User code for device auth (only present with --no-wait) */
  userCode?: string;
  /** Seconds until the device code expires (only present with --no-wait) */
  expiresIn?: number;
  /** Whether auth is pending user verification (only with --no-wait) */
  pendingVerification?: boolean;
  /** Whether auth is pending user verification (alias for agents) */
  pendingAuth?: boolean;
}

// Status subcommand
const status = defineCommand({
  meta: {
    name: "status",
    description: "Show authentication status",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: AuthResult = {
      success: true,
      authenticated: false,
      errors: [],
    };

    if (!args.json) {
      out.header("AUTHENTICATION STATUS");
    }

    const hasToken = hasStoredToken();
    const tokenData = loadToken();
    const user = getCurrentUser();

    result.tokenPath = getTokenStoragePath();
    result.apiEndpoint = getConsoleBaseUrl();

    if (!hasToken || !isTokenValid()) {
      result.authenticated = false;
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Authenticate via browser",
        },
        {
          command: "tambov1 init",
          description: "Set up Tambo (will prompt for auth)",
        },
      ];
      if (!args.json) {
        out.subheader("STATUS: NOT AUTHENTICATED");
        if (!hasToken) {
          out.info("No stored credentials found.");
        } else {
          out.warning("Session has expired.");
        }
        out.keyValue("Token storage", result.tokenPath);
        out.keyValue("API endpoint", result.apiEndpoint);
        out.nextCommands(result.suggestedCommands);
      } else {
        out.json(result);
      }
      return;
    }

    if (!args.json) {
      out.info("Verifying session with server...");
    }

    const spinner = args.json || !isTTY() ? null : ora("Verifying...").start();
    const isValid = await verifySession();
    spinner?.stop();

    if (!isValid) {
      result.authenticated = false;
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Authenticate via browser",
        },
      ];
      if (!args.json) {
        out.subheader("STATUS: SESSION INVALID");
        out.warning("Session was revoked or expired on server.");
        out.nextCommands(result.suggestedCommands);
      } else {
        out.json(result);
      }
      return;
    }

    result.authenticated = true;
    if (user) {
      result.user = {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
      };
    }
    if (tokenData?.expiresAt) {
      result.expiresAt = tokenData.expiresAt;
    }

    result.suggestedCommands = [
      { command: "tambov1 init", description: "Set up Tambo in your project" },
      {
        command: "tambov1 auth sessions",
        description: "View active CLI sessions",
      },
      {
        command: "tambov1 auth logout",
        description: "Clear stored credentials",
      },
    ];

    if (args.json) {
      out.json(result);
      return;
    }

    out.subheader("STATUS: AUTHENTICATED");
    out.success("Valid session");

    if (user) {
      out.keyValue("User", user.email ?? user.id);
      if (user.name) {
        out.keyValue("Name", user.name);
      }
    }

    if (tokenData?.expiresAt) {
      const expiresAt = new Date(tokenData.expiresAt);
      out.keyValue(
        "Expires",
        formatDistanceToNow(expiresAt, { addSuffix: true }),
      );
    }

    out.keyValue("Token storage", result.tokenPath);
    out.keyValue("API endpoint", result.apiEndpoint);

    out.nextCommands(result.suggestedCommands);
  },
});

// Login subcommand
const login = defineCommand({
  meta: {
    name: "login",
    description: "Authenticate via browser",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
    "no-wait": {
      type: "boolean",
      description:
        "Return immediately after starting device auth flow with verification URL (for non-interactive/agent use)",
      default: false,
    },
  },
  async run({ args }) {
    const result: AuthResult = {
      success: false,
      authenticated: false,
      errors: [],
    };

    const noWait = !!(args["no-wait"] ?? args.noWait);

    if (!args.json) {
      out.header("LOGIN TO TAMBO");
    }

    if (hasStoredToken() && isTokenValid()) {
      const user = getCurrentUser();
      result.success = true;
      result.authenticated = true;
      result.suggestedCommands = [
        {
          command: "tambov1 auth logout",
          description: "Log out first to re-authenticate",
        },
        {
          command: "tambov1 init",
          description: "Set up Tambo in your project",
        },
      ];
      if (user) {
        result.user = {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        };
      }
      if (!args.json) {
        out.warning(
          `Already authenticated${user?.email ? ` as ${user.email}` : ""}.`,
        );
        out.explanation([
          "To re-authenticate, first run: tambov1 auth logout",
          "Then run: tambov1 auth login",
        ]);
      } else {
        out.json(result);
      }
      return;
    }

    // When --no-wait is set, initiate device auth but return immediately with verification URL
    if (noWait) {
      try {
        const initResponse = await api.deviceAuth.initiate.mutate();

        result.success = true;
        result.authenticated = false;
        result.pendingVerification = true;
        result.pendingAuth = true;
        result.verificationUrl = initResponse.verificationUriComplete;
        result.userCode = initResponse.userCode;
        result.expiresIn = initResponse.expiresIn;
        result.suggestedCommands = [
          {
            command: "tambov1 auth status",
            description: "Check if authentication completed",
          },
        ];

        if (!args.json) {
          out.subheader("DEVICE AUTHENTICATION INITIATED");
          out.info(
            "Authentication started but not waiting for completion (--no-wait mode).",
          );
          out.keyValue(
            "Verification URL",
            initResponse.verificationUriComplete,
          );
          out.keyValue("User Code", initResponse.userCode);
          out.keyValue("Expires In", `${initResponse.expiresIn} seconds`);
          out.explanation([
            "Open the verification URL in a browser and enter the user code to complete authentication.",
            "After authenticating in the browser, run 'tambov1 auth status' to verify.",
          ]);
        } else {
          out.json(result);
        }
        return;
      } catch (error) {
        const safeMessage = getSafeErrorMessage(error);
        result.errors.push(safeMessage);
        result.suggestedCommands = [
          { command: "tambov1 auth login --no-wait", description: "Try again" },
        ];
        if (!args.json) {
          out.error("Failed to initiate device authentication");
          out.explanation([safeMessage]);
        } else {
          out.json(result);
        }
        process.exit(1);
      }
    }

    if (!args.json) {
      out.subheader("DEVICE AUTHENTICATION");
      out.explanation([
        "A browser window will open for authentication.",
        "If running headless, use the verification URL printed below.",
        "Complete authentication in the browser to continue.",
      ]);
    }

    try {
      const authResult = await runDeviceAuthFlow();
      result.success = true;
      result.authenticated = true;
      result.user = {
        id: authResult.user.id,
        email: authResult.user.email ?? undefined,
        name: authResult.user.name ?? undefined,
      };
      result.suggestedCommands = [
        {
          command: "tambov1 init",
          description: "Set up Tambo in your project",
        },
        {
          command: "tambov1 auth status",
          description: "Check authentication status",
        },
      ];

      if (!args.json) {
        out.success("Successfully authenticated!");
        if (authResult.user.email) {
          out.keyValue("User", authResult.user.email);
        }
        out.nextCommands(result.suggestedCommands);
      } else {
        out.json(result);
      }
    } catch (error) {
      const safeMessage = getSafeErrorMessage(error);
      result.errors.push(safeMessage);
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Try authenticating again",
        },
      ];
      if (!args.json) {
        out.error("Authentication failed");
        out.explanation([
          safeMessage,
          "",
          "Please try again or check your internet connection.",
        ]);
      } else {
        out.json(result);
      }
      process.exit(1);
    }
  },
});

// Logout subcommand
const logout = defineCommand({
  meta: {
    name: "logout",
    description: "Clear stored credentials",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: AuthResult = {
      success: true,
      authenticated: false,
      errors: [],
    };

    if (!args.json) {
      out.header("LOGOUT FROM TAMBO");
    }

    result.suggestedCommands = [
      {
        command: "tambov1 auth login",
        description: "Authenticate via browser",
      },
    ];

    if (!hasStoredToken()) {
      if (!args.json) {
        out.info("Not currently authenticated.");
      }
      if (args.json) {
        out.json(result);
      }
      return;
    }

    const user = getCurrentUser();

    if (!args.json) {
      out.info(`Logging out${user?.email ? ` ${user.email}` : ""}...`);
    }

    clearToken();

    if (!args.json) {
      out.success("Successfully logged out.");
      out.explanation(["Local credentials have been cleared."]);
      out.nextCommands(result.suggestedCommands);
    } else {
      out.json(result);
    }
  },
});

// Sessions subcommand
const sessions = defineCommand({
  meta: {
    name: "sessions",
    description: "List active CLI sessions",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: AuthResult = {
      success: false,
      authenticated: false,
      sessions: [],
      errors: [],
    };

    if (!args.json) {
      out.header("CLI SESSIONS");
    }

    if (!hasStoredToken() || !isTokenValid()) {
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Authenticate via browser",
        },
      ];
      if (!args.json) {
        out.warning("Not authenticated.");
        out.nextCommands(result.suggestedCommands);
      }
      result.errors.push("Not authenticated");
      if (args.json) {
        out.json(result);
      }
      return;
    }

    result.authenticated = true;

    const spinner =
      args.json || !isTTY() ? null : ora("Fetching sessions...").start();

    try {
      const sessionList = await api.deviceAuth.listSessions.query();
      spinner?.stop();

      result.success = true;
      result.sessions = sessionList.map((s) => ({
        id: s.id,
        createdAt: String(s.createdAt),
        expiresAt: s.expiresAt ? String(s.expiresAt) : undefined,
      }));
      result.suggestedCommands = [
        {
          command: "tambov1 auth revoke-session --all",
          description: "Revoke all sessions (requires re-authentication)",
        },
      ];

      if (args.json) {
        out.json(result);
        return;
      }

      if (!sessionList || sessionList.length === 0) {
        out.info("No active CLI sessions found.");
        return;
      }

      out.subheader(`ACTIVE SESSIONS (${sessionList.length})`);

      sessionList.forEach((session, index) => {
        const createdAt = new Date(session.createdAt);
        const expiresAt = session.expiresAt
          ? new Date(session.expiresAt)
          : null;

        console.log(chalk.bold(`  Session ${index + 1}:`));
        console.log(`    ID: ${session.id.slice(0, 16)}...`);
        console.log(
          `    Created: ${formatDistanceToNow(createdAt, { addSuffix: true })}`,
        );
        console.log(
          `    Expires: ${expiresAt ? formatDistanceToNow(expiresAt, { addSuffix: true }) : "Never"}`,
        );
        console.log();
      });

      out.nextCommands(result.suggestedCommands);
    } catch (error) {
      spinner?.fail("Failed to fetch sessions");

      if (isAuthError(error)) {
        clearToken();
        result.errors.push("Session expired");
        result.suggestedCommands = [
          { command: "tambov1 auth login", description: "Re-authenticate" },
        ];
        if (!args.json) {
          out.warning("Session expired. Please re-authenticate.");
        }
      } else {
        const safeMessage = getSafeErrorMessage(error);
        result.errors.push(safeMessage);
        result.suggestedCommands = [
          {
            command: "tambov1 auth status",
            description: "Check authentication status",
          },
        ];
        if (!args.json) {
          out.error(`Error: ${safeMessage}`);
        }
      }

      if (args.json) {
        out.json(result);
      }
    }
  },
});

// Revoke-session subcommand
const revokeSession = defineCommand({
  meta: {
    name: "revoke-session",
    description: "Revoke CLI session(s)",
  },
  args: {
    all: {
      type: "boolean",
      description: "Revoke all sessions",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: AuthResult = {
      success: false,
      authenticated: false,
      errors: [],
    };

    if (!args.json) {
      out.header("REVOKE SESSIONS");
    }

    if (!hasStoredToken() || !isTokenValid()) {
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Authenticate via browser",
        },
      ];
      if (!args.json) {
        out.warning("Not authenticated.");
        out.nextCommands(result.suggestedCommands);
      }
      result.errors.push("Not authenticated");
      if (args.json) {
        out.json(result);
      }
      return;
    }

    result.authenticated = true;

    if (!args.all) {
      result.suggestedCommands = [
        {
          command: "tambov1 auth revoke-session --all",
          description: "Revoke all CLI sessions",
        },
      ];
      if (!args.json) {
        out.info("In non-interactive mode, use --all to revoke all sessions.");
        out.nextCommands(result.suggestedCommands);
      } else {
        result.errors.push(
          "Use --all flag to revoke sessions in non-interactive mode",
        );
        out.json(result);
      }
      return;
    }

    if (!args.json) {
      out.warning("Revoking ALL sessions including this one.");
      out.explanation([
        "You will need to re-authenticate after this operation.",
      ]);
    }

    const spinner =
      args.json || !isTTY() ? null : ora("Revoking all sessions...").start();

    try {
      const revokeResult = await api.deviceAuth.revokeAllSessions.mutate();
      spinner?.stop();

      result.success = true;
      result.suggestedCommands = [
        {
          command: "tambov1 auth login",
          description: "Authenticate via browser",
        },
      ];

      if (revokeResult.revokedCount === 0) {
        if (!args.json) {
          out.info("No sessions to revoke.");
        }
      } else {
        clearToken();

        if (!args.json) {
          out.success(`Revoked ${revokeResult.revokedCount} session(s).`);
          out.explanation(["Local credentials have been cleared."]);
          out.nextCommands(result.suggestedCommands);
        }
      }

      if (args.json) {
        out.json({ ...result, revokedCount: revokeResult.revokedCount });
      }
    } catch (error) {
      spinner?.fail("Failed to revoke sessions");
      const safeMessage = getSafeErrorMessage(error);
      result.errors.push(safeMessage);
      result.suggestedCommands = [
        {
          command: "tambov1 auth sessions",
          description: "Check active sessions",
        },
      ];

      if (!args.json) {
        out.error(`Error: ${safeMessage}`);
      } else {
        out.json(result);
      }
      process.exit(1);
    }
  },
});

// Main auth command with subcommands
export const auth = defineCommand({
  meta: {
    name: "auth",
    description: "Manage authentication",
  },
  subCommands: {
    status,
    login,
    logout,
    sessions,
    "revoke-session": revokeSession,
  },
});
