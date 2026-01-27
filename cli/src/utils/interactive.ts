import chalk from "chalk";
import type { ExecFileSyncOptions, ExecSyncOptions } from "child_process";
import {
  execFileSync as nodeExecFileSync,
  execSync as nodeExecSync,
} from "child_process";
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

  if (forceInteractive) {
    return Boolean(stream && stream.isTTY && term !== "dumb");
  }

  return Boolean(stream && stream.isTTY && term !== "dumb" && !isCI);
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

// Package manager commands that are .cmd batch files on Windows
const WINDOWS_CMD_BINARIES = new Set([
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "rush",
  "rushx",
]);

const isPipedStdio = (
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
 * Safe wrapper around execFileSync (preferred) that prevents execution of external commands
 * in non-interactive environments unless explicitly allowed.
 *
 * Uses execFileSync by default, falls back to execSync only when shell features are needed.
 *
 * On Windows, uses cross-spawn for known package manager binaries (npm, npx, pnpm, yarn, rush)
 * since they are batch files/shims that require cmd.exe invocation.
 *
 * When stdout is not piped (e.g. stdio: "inherit"), this returns an empty string or Buffer.
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
    const commandStr = args ? `${file} ${args.join(" ")}` : file;
    throw new NonInteractiveError(
      `${chalk.red("Error: Cannot execute external command in non-interactive mode.")}\n\n` +
        `${chalk.yellow("Command:")} ${commandStr}\n\n` +
        `${chalk.blue("Reason:")} Running external commands (npm, npx, git) requires user confirmation.\n` +
        `Use appropriate flags to run in interactive mode or provide all necessary options upfront.`,
    );
  }

  // On Windows, package managers are .cmd batch files or shims that require cmd.exe to run.
  // cross-spawn handles the Windows-specific invocation details while keeping args separate.
  if (process.platform === "win32" && WINDOWS_CMD_BINARIES.has(file)) {
    const { stdio, cwd, env, encoding, timeout, maxBuffer, windowsHide } =
      execOptions;

    const isStdoutPiped = isPipedStdio(stdio, 1);
    const isStderrPiped = isPipedStdio(stdio, 2);

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
    const stderrRaw: unknown = isStderrPiped ? result.stderr : undefined;
    const stderr =
      typeof stderrRaw === "string" || stderrRaw instanceof Buffer
        ? stderrRaw
        : undefined;

    if (result.error) {
      const err = result.error as Error & {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
      };
      if (stdout !== undefined) {
        err.stdout = stdout;
      }
      if (stderr !== undefined) {
        err.stderr = stderr;
      }
      throw err;
    }

    if (result.status !== 0) {
      const commandStr = args ? `${file} ${args.join(" ")}` : file;

      let stderrStr: string | undefined;
      if (typeof stderrRaw === "string") {
        stderrStr = stderrRaw;
      } else if (stderrRaw instanceof Buffer) {
        try {
          stderrStr = spawnEncoding
            ? stderrRaw.toString(spawnEncoding)
            : stderrRaw.toString();
        } catch {
          stderrStr = `<non-decodable stderr: ${stderrRaw.length} bytes>`;
        }
      } else if (stderrRaw != null) {
        stderrStr = `<unexpected stderr type: ${Object.prototype.toString.call(stderrRaw)}>`;
      }

      const err = new Error(
        `Command failed (${result.status ?? "unknown status"}): ${commandStr}${
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
