/**
 * Authentication helpers for tambov1 CLI
 *
 * Shared utilities for verifying authentication state across commands.
 */

import ora from "ora";

import { isTokenValid, verifySession } from "../lib/device-auth.js";

import { out } from "./output.js";
import { isTTY } from "./tty.js";

/**
 * Result type that commands must implement to use requireAuthentication.
 */
export interface AuthenticatableResult {
  errors: string[];
  authenticated?: boolean;
}

/**
 * Verifies that the user is authenticated and has a valid session.
 *
 * This function:
 * 1. Checks if a valid token exists locally
 * 2. Verifies the session with the server
 * 3. Updates the result object with errors if authentication fails
 * 4. Handles JSON mode output appropriately
 *
 * @param args - Command arguments containing json flag
 * @param result - Result object that will be updated with errors/authenticated state
 * @returns true if authenticated, false if not (caller should exit with process.exit(1))
 */
export async function requireAuthentication(
  args: { json: boolean },
  result: AuthenticatableResult,
): Promise<boolean> {
  if (!isTokenValid()) {
    result.errors.push("Not authenticated");
    if (args.json) {
      out.json(result);
    } else {
      out.error("Not authenticated. Run 'tambov1 auth login' first.");
    }
    return false;
  }

  const spinner =
    args.json || !isTTY() ? null : ora("Verifying session...").start();
  const isValid = await verifySession();
  spinner?.stop();

  if (!isValid) {
    result.errors.push("Session expired");
    if (args.json) {
      out.json(result);
    } else {
      out.error(
        "Session expired. Run 'tambov1 auth login' to re-authenticate.",
      );
    }
    return false;
  }

  if ("authenticated" in result) {
    result.authenticated = true;
  }

  return true;
}
