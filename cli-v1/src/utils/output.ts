/**
 * Agent output utilities for tambov1 CLI.
 *
 * Provides verbose, structured output optimized for coding agents:
 * - Clear section headers and separators
 * - Detailed explanations of what's happening
 * - Suggested next commands with example values
 * - Machine-parseable JSON output option
 */

import chalk from "chalk";
import { isTTY } from "./tty.js";

export interface CommandSuggestion {
  command: string;
  description: string;
  example?: string;
}

// Lazy evaluation of TTY state to avoid module-level side effects
let _isInteractive: boolean | undefined;
function getIsInteractive(): boolean {
  if (_isInteractive === undefined) {
    _isInteractive = isTTY();
    if (!_isInteractive) {
      chalk.level = 0;
    }
  }
  return _isInteractive;
}

// Getters for lazy evaluation of display constants
function getSeparator(): string {
  return (getIsInteractive() ? "─" : "-").repeat(60);
}

function getThickSeparator(): string {
  return (getIsInteractive() ? "═" : "=").repeat(60);
}

function getSymbols(): Record<string, string> {
  const interactive = getIsInteractive();
  return {
    success: interactive ? "✓" : "OK",
    info: interactive ? "ℹ" : "INFO",
    warning: interactive ? "⚠" : "WARN",
    error: interactive ? "✗" : "ERROR",
    pointer: interactive ? "▶" : ">",
    pipe: interactive ? "│" : "|",
  };
}

/**
 * Print a section header with separator
 */
export function header(title: string): void {
  const thickSep = getThickSeparator();
  console.log();
  console.log(chalk.bold.cyan(thickSep));
  console.log(chalk.bold.cyan(`  ${title.toUpperCase()}`));
  console.log(chalk.bold.cyan(thickSep));
  console.log();
}

/**
 * Print a subsection header
 */
export function subheader(title: string): void {
  const symbols = getSymbols();
  console.log();
  console.log(chalk.bold.yellow(`${symbols.pointer} ${title}`));
  console.log(chalk.dim(getSeparator()));
}

/**
 * Print a key-value pair with proper formatting
 */
export function keyValue(key: string, value: string | undefined): void {
  const displayValue = value ?? chalk.dim("(not set)");
  console.log(`  ${chalk.bold(key + ":")} ${displayValue}`);
}

/**
 * Print a success message
 */
export function success(message: string): void {
  const symbols = getSymbols();
  console.log(chalk.green(`${symbols.success} ${message}`));
}

/**
 * Print an info message
 */
export function info(message: string): void {
  const symbols = getSymbols();
  console.log(chalk.blue(`${symbols.info} ${message}`));
}

/**
 * Print a warning message
 */
export function warning(message: string): void {
  const symbols = getSymbols();
  console.log(chalk.yellow(`${symbols.warning} ${message}`));
}

/**
 * Print an error message
 */
export function error(message: string): void {
  const symbols = getSymbols();
  console.log(chalk.red(`${symbols.error} ${message}`));
}

/**
 * Print a verbose explanation
 */
export function explanation(lines: string[]): void {
  const symbols = getSymbols();
  lines.forEach((line) => {
    console.log(chalk.dim(`  ${symbols.pipe} ${line}`));
  });
}

/**
 * Print suggested next commands with full examples
 */
export function nextCommands(suggestions: CommandSuggestion[]): void {
  subheader("SUGGESTED NEXT COMMANDS");

  suggestions.forEach((suggestion, index) => {
    console.log(chalk.bold.white(`  ${index + 1}. ${suggestion.description}`));
    console.log(chalk.cyan(`     $ ${suggestion.command}`));

    if (suggestion.example) {
      console.log(chalk.dim(`     Example: ${suggestion.example}`));
    }

    console.log();
  });
}

/**
 * Print JSON output for machine parsing
 */
export function json(data: object): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print operation summary at the end of a command
 */
export function summary(opts: {
  operation: string;
  success: boolean;
  details: Record<string, string | number | boolean | undefined>;
  nextCommands: CommandSuggestion[];
}): void {
  subheader("OPERATION SUMMARY");

  console.log(`  ${chalk.bold("Operation:")} ${opts.operation}`);
  console.log(
    `  ${chalk.bold("Status:")} ${opts.success ? chalk.green("SUCCESS") : chalk.red("FAILED")}`,
  );

  console.log();
  console.log(chalk.bold("  Details:"));
  Object.entries(opts.details).forEach(([key, value]) => {
    if (value !== undefined) {
      console.log(`    ${key}: ${value}`);
    }
  });

  if (opts.nextCommands.length > 0) {
    nextCommands(opts.nextCommands);
  }
}

/**
 * Print a file change summary
 */
export function fileChanges(changes: {
  created: string[];
  modified: string[];
  deleted: string[];
}): void {
  subheader("FILE CHANGES");

  if (changes.created.length > 0) {
    console.log(chalk.green("  Created:"));
    changes.created.forEach((file) =>
      console.log(chalk.green(`    + ${file}`)),
    );
  }

  if (changes.modified.length > 0) {
    console.log(chalk.yellow("  Modified:"));
    changes.modified.forEach((file) =>
      console.log(chalk.yellow(`    ~ ${file}`)),
    );
  }

  if (changes.deleted.length > 0) {
    console.log(chalk.red("  Deleted:"));
    changes.deleted.forEach((file) => console.log(chalk.red(`    - ${file}`)));
  }

  if (
    changes.created.length === 0 &&
    changes.modified.length === 0 &&
    changes.deleted.length === 0
  ) {
    console.log(chalk.dim("  No file changes"));
  }

  console.log();
}

/**
 * Namespace for cleaner imports
 */
export const out = {
  header,
  subheader,
  keyValue,
  success,
  info,
  warning,
  error,
  explanation,
  nextCommands,
  json,
  summary,
  fileChanges,
};
