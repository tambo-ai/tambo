/**
 * Error recovery and formatting for code execution
 *
 * Provides categorization and user-friendly formatting of execution errors
 * with actionable suggestions for resolution.
 */

import chalk from "chalk";
import path from "node:path";
import type { ExecutionError } from "./types.js";

/**
 * Categorizes an execution error and provides contextual suggestions.
 * Analyzes error codes and messages to determine failure phase and causes.
 *
 * @param error - The error that occurred
 * @param filePath - Optional file path where error occurred
 * @returns ExecutionError with phase, cause, and suggestions
 */
export function categorizeExecutionError(
  error: Error,
  filePath?: string,
): ExecutionError {
  const errno = (error as NodeJS.ErrnoException).code;
  const message = error.message;

  // Check for specific errno codes
  if (errno === "EACCES") {
    return {
      phase: "file-write",
      filePath,
      cause: message,
      suggestions: [
        "Check file and directory permissions",
        filePath ? `Run: chmod u+w ${filePath}` : "Run: chmod u+w <file>",
        "Check if file is locked by another process",
      ],
    };
  }

  if (errno === "ENOSPC") {
    return {
      phase: "file-write",
      filePath,
      cause: message,
      suggestions: [
        "Free up disk space",
        "Check available space with: df -h",
        "Remove temporary files or unused dependencies",
      ],
    };
  }

  if (errno === "ENOENT") {
    const parentDir = filePath ? path.dirname(filePath) : undefined;
    return {
      phase: "file-write",
      filePath,
      cause: message,
      suggestions: [
        "Parent directory does not exist",
        parentDir
          ? `Check directory path: ${parentDir}`
          : "Check directory path",
        "Verify project structure is intact",
      ],
    };
  }

  // Check message for dependency/install errors
  if (
    message.includes("dependency") ||
    message.includes("install") ||
    message.includes("npm") ||
    message.includes("pnpm") ||
    message.includes("yarn")
  ) {
    return {
      phase: "dependency-install",
      filePath,
      cause: message,
      suggestions: [
        "Check network connection",
        "Verify package name and version",
        "Try clearing package manager cache",
        "Check registry configuration",
      ],
    };
  }

  // Generic error
  return {
    phase: "file-write",
    filePath,
    cause: message,
    suggestions: [
      "Check error message for details",
      "Verify file path and permissions",
      "Try running the command again",
    ],
  };
}

/**
 * Formats an execution error for terminal display.
 * Uses color coding and clear structure for readability.
 *
 * @param error - ExecutionError to format
 * @returns Formatted error string with colors
 */
export function formatExecutionError(error: ExecutionError): string {
  const lines: string[] = [];

  // Header: red
  lines.push(chalk.red(`\nExecution failed during ${error.phase}`));
  lines.push("");

  // File path: yellow (if present)
  if (error.filePath) {
    lines.push(chalk.yellow(`File: ${error.filePath}`));
  }

  // Cause: yellow
  lines.push(chalk.yellow(`Cause: ${error.cause}`));
  lines.push("");

  // Suggestions: blue, numbered
  if (error.suggestions.length > 0) {
    lines.push(chalk.blue("Suggestions:"));
    error.suggestions.forEach((suggestion, index) => {
      lines.push(chalk.blue(`  ${index + 1}. ${suggestion}`));
    });
  }

  lines.push("");
  return lines.join("\n");
}
