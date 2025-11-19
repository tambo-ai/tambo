import chalk from "chalk";
import { execSync as nodeExecSync } from "child_process";
import type { ExecSyncOptions } from "child_process";
import inquirer from "inquirer";

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
  questions: Parameters<typeof inquirer.prompt>[0],
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
  ${chalk.cyan("--accept-all")}         Accept all upgrades (upgrade command)

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

/**
 * Safe wrapper around execSync that prevents execution of external commands
 * in non-interactive environments.
 *
 * @param command - The command to execute
 * @param options - Options to pass to execSync
 * @throws NonInteractiveError if running in a non-interactive environment
 */
export function execSync(
  command: string,
  options?: ExecSyncOptions,
): Buffer | string {
  if (!isInteractive()) {
    throw new NonInteractiveError(
      `${chalk.red("Error: Cannot execute external command in non-interactive mode.")}\n\n` +
        `${chalk.yellow("Command:")} ${command}\n\n` +
        `${chalk.blue("Reason:")} Running external commands (npm, npx, git) requires user confirmation.\n` +
        `Use appropriate flags to run in interactive mode or provide all necessary options upfront.`,
    );
  }

  return nodeExecSync(command, options);
}
