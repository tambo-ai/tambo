/**
 * Utilities for displaying colored diffs in the terminal
 */

import chalk from "chalk";
import type { FileDiff } from "./types.js";

/**
 * Format a unified diff patch with color codes for terminal display
 *
 * @param patch - Unified diff patch string
 * @returns Colorized diff string
 */
export function formatDiffForDisplay(patch: string): string {
  const lines = patch.split("\n");

  const coloredLines = lines.map((line) => {
    // Hunk headers (@@)
    if (line.startsWith("@@")) {
      return chalk.cyan(line);
    }

    // File headers (---, +++)
    if (line.startsWith("---") || line.startsWith("+++")) {
      return chalk.bold.dim(line);
    }

    // Index and separator lines
    if (line.startsWith("Index:") || line.startsWith("===")) {
      return chalk.bold(line);
    }

    // Added lines
    if (line.startsWith("+")) {
      return chalk.green(line);
    }

    // Removed lines
    if (line.startsWith("-")) {
      return chalk.red(line);
    }

    // Context lines (everything else)
    return chalk.dim(line);
  });

  return coloredLines.join("\n");
}

/**
 * Display a file diff with colored formatting
 *
 * @param diff - FileDiff object to display
 */
export function displayFileDiff(diff: FileDiff): void {
  // Print file path header
  console.log(chalk.bold(`\n${diff.filePath}`));

  // Print formatted diff
  console.log(formatDiffForDisplay(diff.patch));
}

/**
 * Display a message for new file creation
 *
 * @param filePath - Path to the new file
 * @param lineCount - Number of lines in the new file
 */
export function displayNewFileMessage(
  filePath: string,
  lineCount: number,
): void {
  console.log(
    `${chalk.green("+ Will create")} ${chalk.bold(filePath)} ${chalk.dim(`(${lineCount} lines)`)}`,
  );
}
