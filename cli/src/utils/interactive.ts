import chalk from "chalk";
import {
  execFileSync as nodeExecFileSync,
  execSync as nodeExecSync,
} from "child_process";
import type { ExecFileSyncOptions, ExecSyncOptions } from "child_process";
import inquirer from "inquirer";
import type { Answers, DistinctQuestion, PromptSession } from "inquirer";

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

/**
 * Safe wrapper around execFileSync (preferred) that prevents execution of external commands
 * in non-interactive environments unless explicitly allowed.
 *
 * Uses execFileSync by default (more secure - doesn't invoke shell), falls back to execSync
 * only when shell features are needed.
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
