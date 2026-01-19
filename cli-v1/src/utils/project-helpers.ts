/**
 * Project validation helpers for tambov1 CLI
 *
 * Shared utilities for validating project structure across commands.
 */

import fs from "fs";

import { out } from "./output.js";

/**
 * Result type that commands must implement to use requirePackageJson.
 */
export interface ProjectValidatableResult {
  errors: string[];
}

/**
 * Verifies that a package.json exists in the current directory.
 *
 * This function:
 * 1. Checks if package.json exists
 * 2. Updates the result object with errors if validation fails
 * 3. Handles JSON mode output appropriately
 *
 * @param args - Command arguments containing json flag
 * @param result - Result object that will be updated with errors
 * @returns true if package.json exists, false if not (caller should exit with process.exit(1))
 */
export function requirePackageJson(
  args: { json: boolean },
  result: ProjectValidatableResult,
): boolean {
  if (!fs.existsSync("package.json")) {
    result.errors.push("No package.json found");
    if (args.json) {
      out.json(result);
    } else {
      out.error(
        "No package.json found. Run this command in your project root.",
      );
    }
    return false;
  }
  return true;
}

/**
 * Verifies that a package.json exists and can be parsed.
 *
 * This function:
 * 1. Checks if package.json exists and is valid JSON
 * 2. Updates the result object with errors if validation fails
 * 3. Handles JSON mode output appropriately
 * 4. Optionally prints additional explanation lines
 *
 * @param args - Command arguments containing json flag
 * @param result - Result object that will be updated with errors
 * @param explanation - Optional explanation lines to show on failure
 * @returns true if package.json is valid, false if not (caller should exit with process.exit(1))
 */
export function requireValidPackageJson(
  args: { json: boolean },
  result: ProjectValidatableResult,
  explanation?: string[],
): boolean {
  try {
    JSON.parse(fs.readFileSync("package.json", "utf8"));
    return true;
  } catch {
    result.errors.push("Invalid project - no package.json found");
    if (args.json) {
      out.json(result);
    } else {
      out.error("No valid package.json found in current directory");
      if (explanation) {
        out.explanation(explanation);
      } else {
        out.explanation([
          "Run this command from the root of your project.",
          "The package.json file is required for Tambo setup.",
        ]);
      }
    }
    return false;
  }
}
