import chalk from "chalk";
import type { ExecFileSyncOptions, ExecSyncOptions } from "child_process";
import {
  execFileSync as nodeExecFileSync,
  execSync as nodeExecSync,
} from "child_process";
import path from "node:path";
import spawn from "cross-spawn";
import type { Answers, DistinctQuestion, PromptSession } from "inquirer";
import inquirer from "inquirer";

type InquirerPromptQuestions = PromptSession<
  Answers,
  DistinctQuestion<Answers>
>;

/**
 * Checks if the current environment is interactive.
 * Based on the is-interactive package logic.
 *
 * For prompts to work correctly, both stdin (for input) and stdout (for display)
 * must be TTYs. This function checks both by default.
 */
export function isInteractive({
  stream = process.stdout,
}: { stream?: NodeJS.WriteStream } = {}): boolean {
  const term = process.env.TERM;
  const isCI = Boolean(
    (typeof process.env.CI === "string" &&
      process.env.CI.trim() !== "" &&
      process.env.CI !== "0") ||
    process.env.GITHUB_ACTIONS === "true",
  );
  const forceInteractive = process.env.FORCE_INTERACTIVE === "1";

  // Check both stdin and stdout TTY status for true interactivity.
  // Prompts need stdin to receive input and stdout to display prompts.
  const stdinIsTTY = process.stdin.isTTY;
  const streamIsTTY = stream?.isTTY;

  if (forceInteractive) {
    return Boolean(stdinIsTTY && streamIsTTY && term !== "dumb");
  }

  return Boolean(stdinIsTTY && streamIsTTY && term !== "dumb" && !isCI);
}

/**
 * Error thrown when a prompt is attempted in a non-interactive environment
 */
export class NonInteractiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonInteractiveError";
  }
}

/**
 * Error thrown when a command needs user action in non-interactive mode.
 * Unlike NonInteractiveError, this provides specific guidance on what flags to use.
 * The CLI entry point catches these and exits with code 2 (user action required).
 */
export class GuidanceError extends Error {
  /**
   * @param message - Brief error message (e.g., "Project name required")
   * @param guidance - Array of example commands showing how to resolve the issue
   */
  constructor(
    message: string,
    public readonly guidance: string[],
  ) {
    super(message);
    this.name = "GuidanceError";
  }
}

/**
 * Wrapper around inquirer.prompt that checks for interactivity first.
 * If running in a non-interactive environment, throws a NonInteractiveError
 * with helpful guidance on what flags to pass.
 *
 * @param questions - Inquirer questions to prompt
 * @param helpMessage - Optional custom help message explaining what flags to use
 * @returns Promise resolving to the prompt answers
 * @throws NonInteractiveError if not in an interactive environment
 */
export async function interactivePrompt<T>(
  questions: InquirerPromptQuestions,
  helpMessage?: string,
): Promise<T> {
  if (!isInteractive()) {
    const defaultHelp = `
${chalk.red("Error: This command requires user input but is running in a non-interactive environment.")}

${chalk.yellow("Solution:")}
Use command-line flags to skip prompts. Common options:
  ${chalk.cyan("--yes, -y")}            Auto-answer yes to all prompts
  ${chalk.cyan("--prefix <path>")}      Specify component directory
  ${chalk.cyan("--template <name>")}    Specify template to use

Run ${chalk.cyan("tambo --help")} or ${chalk.cyan("tambo <command> --help")} for more options.
`;

    const fullMessage = helpMessage
      ? `${helpMessage}\n${defaultHelp}`
      : defaultHelp;

    throw new NonInteractiveError(fullMessage);
  }

  const result = await inquirer.prompt(questions);
  return result as T;
}

export interface SafeExecSyncOptions extends ExecSyncOptions {
  /**
   * Allow execution in non-interactive mode (e.g., when user passes --yes flag)
   */
  allowNonInteractive?: boolean;
}

export interface SafeExecFileSyncOptions extends ExecFileSyncOptions {
  /**
   * Allow execution in non-interactive mode (e.g., when user passes --yes flag)
   */
  allowNonInteractive?: boolean;
}

// Extensions for Windows shim/batch executables that should map into WINDOWS_CMD_BINARIES.
const WINDOWS_CMD_EXTENSIONS = [".cmd", ".exe", ".bat"] as const;

// Helper for internal package-manager detection on Windows.
const normalizeWindowsCmdBinaryName = (file: string): string => {
  const baseName = path.win32.basename(file).toLowerCase();

  for (const ext of WINDOWS_CMD_EXTENSIONS) {
    if (baseName.endsWith(ext)) {
      return baseName.slice(0, -ext.length);
    }
  }

  return baseName;
};

// Package manager commands that are batch files/shims on Windows.
// Stored as normalized lowercase names without extensions.
const WINDOWS_CMD_BINARIES = new Set([
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "rush",
  "rushx",
]);

// Treat stdio as "piped" only when:
// - top-level stdio is undefined or "pipe" (Node default is piped stdout/stderr), or
// - array stdio has undefined/null or "pipe" at the given index.
// Any other values (including custom streams/fds) are treated as non-piped since the output
// is not available to capture synchronously.
const isDefaultPipedStdio = (
  stdio: ExecFileSyncOptions["stdio"] | undefined,
  index: 1 | 2,
): boolean => {
  if (stdio === undefined || stdio === "pipe") {
    return true;
  }

  if (stdio === "ignore" || stdio === "inherit") {
    return false;
  }

  if (Array.isArray(stdio)) {
    const stdioAtIndex = stdio[index];
    return stdioAtIndex == null || stdioAtIndex === "pipe";
  }

  return false;
};

/**
 * Formats a command and args for diagnostic output.
 * Uses JSON.stringify for args to preserve actual boundaries (spaces, special chars).
 * This avoids misleading output when users copy/paste error messages.
 *
 * @returns A structured string like: `npm ["install", "my package"]`
 */
const formatCommandForDiagnostics = (
  file: string,
  args?: readonly string[],
): string => {
  if (!args || args.length === 0) {
    return file;
  }
  return `${file} ${JSON.stringify(args)}`;
};

/**
 * Safe wrapper around execFileSync (preferred) that prevents execution of external commands
 * in non-interactive environments unless explicitly allowed.
 *
 * Uses execFileSync by default, falls back to execSync only when shell features are needed.
 *
 * On Windows, uses cross-spawn for known package manager binaries (npm, npx, pnpm, yarn, rush)
 * since they are batch files/shims that require cmd.exe invocation.
 *
 * Important: when stdout is not piped (e.g. `stdio: "inherit"` or array stdio with a non-pipe
 * value at index 1), this function does not attempt to capture output and instead returns an
 * empty string (for string encodings) or an empty Buffer, even if the child process writes to
 * stdout.
 *
 * Note: on Windows package manager binaries, only a subset of ExecFileSync options is honored
 * (stdio, cwd, env, encoding, timeout, maxBuffer, windowsHide).
 *
 * @param file - The file/command to execute
 * @param args - Arguments to pass to the command
 * @param options - Options to pass to execFileSync, including allowNonInteractive flag
 * @throws NonInteractiveError if running in a non-interactive environment without allowNonInteractive
 */
export function execFileSync(
  file: string,
  args?: readonly string[],
  options?: SafeExecFileSyncOptions,
): Buffer | string {
  const { allowNonInteractive, ...execOptions } = options ?? {};

  if (!isInteractive() && !allowNonInteractive) {
    throw new NonInteractiveError(
      `${chalk.red("Error: Cannot execute external command in non-interactive mode.")}\n\n` +
        `${chalk.yellow("Command:")} ${formatCommandForDiagnostics(file, args)}\n\n` +
        `${chalk.blue("Reason:")} Running external commands (npm, npx, git) requires user confirmation.\n` +
        `Use appropriate flags to run in interactive mode or provide all necessary options upfront.`,
    );
  }

  const isWindows = process.platform === "win32";
  const normalizedWindowsCmdBinary = isWindows
    ? normalizeWindowsCmdBinaryName(file)
    : undefined;

  // On Windows, package managers are batch files/shims that require cmd.exe to run.
  // We normalize the command to a lowercase basename (stripping common Windows extensions)
  // and only special-case it when the normalized name is in WINDOWS_CMD_BINARIES.
  // cross-spawn handles the Windows-specific invocation details while keeping args separate.
  if (
    isWindows &&
    normalizedWindowsCmdBinary &&
    WINDOWS_CMD_BINARIES.has(normalizedWindowsCmdBinary)
  ) {
    const { stdio, cwd, env, encoding, timeout, maxBuffer, windowsHide } =
      execOptions;

    const isStdoutPiped = isDefaultPipedStdio(stdio, 1);
    const isStderrPiped = isDefaultPipedStdio(stdio, 2);

    const spawnEncoding =
      typeof encoding === "string" && encoding !== "buffer"
        ? encoding
        : undefined;
    const result = spawn.sync(file, args ?? [], {
      stdio,
      cwd,
      env,
      encoding: spawnEncoding,
      timeout,
      maxBuffer,
      windowsHide,
    });

    const stdout = isStdoutPiped ? (result.stdout ?? undefined) : undefined;
    const stderr = isStderrPiped ? (result.stderr ?? undefined) : undefined;

    if (result.error) {
      const baseError = result.error as NodeJS.ErrnoException & {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
      };

      try {
        if (stdout !== undefined) {
          baseError.stdout = stdout;
        }
        if (stderr !== undefined) {
          baseError.stderr = stderr;
        }
      } catch {
        // Ignore (some errors can be non-extensible) and throw the original error.
      }

      throw baseError;
    }

    if (result.status !== 0) {
      let stderrStr: string | undefined;
      if (typeof stderr === "string") {
        stderrStr = stderr;
      } else if (stderr instanceof Buffer) {
        try {
          stderrStr = spawnEncoding
            ? stderr.toString(spawnEncoding)
            : stderr.toString();
        } catch {
          stderrStr = `<non-decodable stderr: ${stderr.length} bytes; see err.stderr for raw data>`;
        }
      }

      const err = new Error(
        `Command failed (${result.status ?? "unknown status"}): ${formatCommandForDiagnostics(file, args)}${
          stderrStr ? `\n${stderrStr.trim()}` : ""
        }`,
      ) as Error & {
        status?: number | null;
        signal?: NodeJS.Signals | null;
        stdout?: Buffer | string;
        stderr?: Buffer | string;
      };
      // Keep the status/signal available for callers that want to inspect.
      err.status = result.status;
      err.signal = result.signal;
      if (stdout !== undefined) {
        err.stdout = stdout;
      }
      if (stderr !== undefined) {
        err.stderr = stderr;
      }
      throw err;
    }

    if (!isStdoutPiped) {
      // stdout is being inherited/redirected, so there's nothing for us to capture.
      return spawnEncoding ? "" : Buffer.alloc(0);
    }

    if (result.stdout != null) {
      if (spawnEncoding) {
        return typeof result.stdout === "string"
          ? result.stdout
          : result.stdout.toString(spawnEncoding);
      }

      return Buffer.isBuffer(result.stdout)
        ? result.stdout
        : Buffer.from(String(result.stdout));
    }

    return spawnEncoding ? "" : Buffer.alloc(0);
  }

  return nodeExecFileSync(file, args, execOptions);
}

/**
 * Safe wrapper around execSync that prevents execution of external commands
 * in non-interactive environments unless explicitly allowed.
 *
 * SECURITY WARNING: This uses execSync which invokes a shell and is vulnerable to
 * shell injection. Prefer execFileSync when possible. Only use this when you need
 * shell features like pipes, redirects, or glob expansion.
 *
 * @param command - The command to execute
 * @param options - Options to pass to execSync, including allowNonInteractive flag
 * @throws NonInteractiveError if running in a non-interactive environment without allowNonInteractive
 */
export function execSync(
  command: string,
  options?: SafeExecSyncOptions,
): Buffer | string {
  const { allowNonInteractive, ...execOptions } = options ?? {};

  if (!isInteractive() && !allowNonInteractive) {
    throw new NonInteractiveError(
      `${chalk.red("Error: Cannot execute external command in non-interactive mode.")}\n\n` +
        `${chalk.yellow("Command:")} ${command}\n\n` +
        `${chalk.blue("Reason:")} Running external commands (npm, npx, git) requires user confirmation.\n` +
        `Use appropriate flags to run in interactive mode or provide all necessary options upfront.`,
    );
  }

  return nodeExecSync(command, execOptions);
}
