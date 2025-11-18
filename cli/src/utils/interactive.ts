import chalk from "chalk";
import inquirer from "inquirer";

/**
 * Checks if the current environment is interactive.
 * Based on the is-interactive package logic.
 */
export function isInteractive({
  stream = process.stdout,
}: { stream?: NodeJS.WriteStream } = {}): boolean {
  const term = process.env.TERM;
  const isCI = "CI" in process.env;
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
