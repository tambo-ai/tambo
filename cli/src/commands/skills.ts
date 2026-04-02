import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import Table from "cli-table3";
import fs from "fs";
import ora from "ora";
import {
  parseSkillContent,
  reconstructSkillContent,
} from "../utils/skill-frontmatter.js";
import type { Skill } from "../lib/api-client.js";
import { api, isAuthError } from "../lib/api-client.js";
import { hasStoredToken, isTokenValid } from "../lib/token-storage.js";
import { EVENTS, trackEvent } from "../lib/telemetry.js";
import { GuidanceError, isInteractive } from "../utils/interactive.js";
import { findTamboApiKey } from "../utils/dotenv-utils.js";

// ============================================================================
// Project Resolution
// ============================================================================

/**
 * Read the Tambo API key from .env.local or .env in the current directory.
 * @returns The API key string, or null if not found.
 */
function readApiKeyFromEnv(): string | null {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) continue;
    const content = fs.readFileSync(envFile, "utf-8");
    const found = findTamboApiKey(content);
    if (found) return found.value;
  }
  return null;
}

/**
 * Resolve the project ID for the current directory.
 * Requires both a valid session token and an API key in .env.local.
 * @returns The project ID string.
 */
async function resolveProjectId(): Promise<string> {
  const apiKey = readApiKeyFromEnv();
  const hasToken = hasStoredToken() && isTokenValid();

  if (!apiKey && !hasToken) {
    console.error(
      chalk.red("\nCannot resolve project. Two things are needed:"),
    );
    console.error(
      chalk.gray(
        `  1. Run ${chalk.cyan("tambo auth login")} to authenticate\n` +
          `  2. Run ${chalk.cyan("tambo init")} to set up a project API key`,
      ),
    );
    throw new Error("Missing both session token and API key");
  }

  if (!hasToken) {
    console.error(chalk.red("\nNot authenticated."));
    console.error(
      chalk.gray(`Run ${chalk.cyan("tambo auth login")} to authenticate.`),
    );
    throw new Error("Not authenticated");
  }

  if (!apiKey) {
    console.error(chalk.red("\nNo Tambo API key found in .env.local or .env."));
    console.error(
      chalk.gray(`Run ${chalk.cyan("tambo init")} to set up your project.`),
    );
    throw new Error("No API key found");
  }

  const { projectId } = await api.project.resolveProjectFromApiKey.mutate({
    apiKey,
  });
  return projectId;
}

// ============================================================================
// Subcommand Handlers (each returns exit code: 0 success, 1 failure)
// ============================================================================

async function handleList(projectId: string): Promise<number> {
  const spinner = ora("Fetching skills...").start();

  try {
    const skills = await api.skills.list.query({ projectId });
    spinner.stop();

    if (skills.length === 0) {
      console.log(
        chalk.gray(
          `\nNo skills found. Use ${chalk.cyan("tambo skills add <file.md>")} to create one.\n`,
        ),
      );
      return 0;
    }

    const table = new Table({
      head: [
        chalk.bold("Name"),
        chalk.bold("Description"),
        chalk.bold("Enabled"),
      ],
    });

    for (const skill of skills) {
      const desc =
        skill.description.length > 40
          ? `${skill.description.slice(0, 37)}...`
          : skill.description;
      table.push([
        skill.name,
        desc,
        skill.enabled ? chalk.green("yes") : chalk.gray("no"),
      ]);
    }

    console.log(`\n${table.toString()}\n`);
    return 0;
  } catch (error) {
    spinner.fail("Failed to fetch skills");
    logApiError(error);
    return 1;
  }
}

async function handleAdd(
  projectId: string,
  filePaths: string[],
): Promise<number> {
  if (filePaths.length === 0) {
    console.error(chalk.red("\nNo files specified."));
    console.error(
      chalk.gray(
        `Usage: ${chalk.cyan("tambo skills add <file.md> [file2.md] [...]")}`,
      ),
    );
    return 1;
  }

  let successCount = 0;
  let failCount = 0;

  for (const filePath of filePaths) {
    const spinner = ora(`Adding skill from ${filePath}...`).start();

    if (!fs.existsSync(filePath)) {
      spinner.fail(`File not found: ${filePath}`);
      failCount++;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseSkillContent(content);

    if (!parsed.success) {
      spinner.fail(`Invalid frontmatter in ${filePath}: ${parsed.error}`);
      failCount++;
      continue;
    }

    try {
      await api.skills.create.mutate({
        projectId,
        name: parsed.name,
        description: parsed.description,
        instructions: parsed.instructions,
      });
      spinner.succeed(`Created skill: ${chalk.cyan(parsed.name)}`);
      successCount++;
    } catch (error) {
      if (isConflictError(error)) {
        spinner.fail(
          `Skill '${parsed.name}' already exists. Use ${chalk.cyan("tambo skills update")} instead.`,
        );
      } else {
        spinner.fail(`Failed to create skill '${parsed.name}'`);
        logApiError(error);
      }
      failCount++;
    }
  }

  if (filePaths.length > 1) {
    const summary =
      failCount > 0
        ? chalk.yellow(
            `\nCreated ${successCount} of ${filePaths.length} skills (${failCount} failed)`,
          )
        : chalk.green(`\nCreated ${successCount} skills`);
    console.log(summary);
  }

  return failCount > 0 && successCount === 0 ? 1 : 0;
}

async function handleGet(
  projectId: string,
  name: string | undefined,
): Promise<number> {
  if (!name) {
    console.error(chalk.red("\nNo skill name specified."));
    console.error(
      chalk.gray(`Usage: ${chalk.cyan("tambo skills get <name>")}`),
    );
    return 1;
  }

  const spinner = ora("Fetching skill...").start();

  try {
    const skills = await api.skills.list.query({ projectId });
    const skill = skills.find((s) => s.name === name);

    if (!skill) {
      spinner.fail(`Skill '${name}' not found.`);
      console.error(
        chalk.gray(
          `Run ${chalk.cyan("tambo skills list")} to see available skills.`,
        ),
      );
      return 1;
    }

    spinner.stop();
    const content = reconstructSkillContent(
      skill.name,
      skill.description,
      skill.instructions,
    );
    process.stdout.write(content);
    return 0;
  } catch (error) {
    spinner.fail("Failed to fetch skill");
    logApiError(error);
    return 1;
  }
}

async function handleUpdate(
  projectId: string,
  filePaths: string[],
): Promise<number> {
  if (filePaths.length === 0) {
    console.error(chalk.red("\nNo files specified."));
    console.error(
      chalk.gray(
        `Usage: ${chalk.cyan("tambo skills update <file.md> [file2.md] [...]")}`,
      ),
    );
    return 1;
  }

  // Fetch skills list once for name-to-ID lookup
  const spinner = ora("Fetching current skills...").start();
  let existingSkills: Skill[];
  try {
    existingSkills = await api.skills.list.query({ projectId });
    spinner.stop();
  } catch (error) {
    spinner.fail("Failed to fetch skills");
    logApiError(error);
    return 1;
  }

  let successCount = 0;
  let failCount = 0;

  for (const filePath of filePaths) {
    const updateSpinner = ora(`Updating skill from ${filePath}...`).start();

    if (!fs.existsSync(filePath)) {
      updateSpinner.fail(`File not found: ${filePath}`);
      failCount++;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseSkillContent(content);

    if (!parsed.success) {
      updateSpinner.fail(`Invalid frontmatter in ${filePath}: ${parsed.error}`);
      failCount++;
      continue;
    }

    const existing = existingSkills.find((s) => s.name === parsed.name);
    if (!existing) {
      updateSpinner.fail(
        `Skill '${parsed.name}' not found. Use ${chalk.cyan("tambo skills add")} to create it.`,
      );
      failCount++;
      continue;
    }

    try {
      await api.skills.update.mutate({
        projectId,
        skillId: existing.id,
        name: parsed.name,
        description: parsed.description,
        instructions: parsed.instructions,
      });
      updateSpinner.succeed(`Updated skill: ${chalk.cyan(parsed.name)}`);
      successCount++;
    } catch (error) {
      updateSpinner.fail(`Failed to update skill '${parsed.name}'`);
      logApiError(error);
      failCount++;
    }
  }

  if (filePaths.length > 1) {
    const summary =
      failCount > 0
        ? chalk.yellow(
            `\nUpdated ${successCount} of ${filePaths.length} skills (${failCount} failed)`,
          )
        : chalk.green(`\nUpdated ${successCount} skills`);
    console.log(summary);
  }

  return failCount > 0 && successCount === 0 ? 1 : 0;
}

async function handleDelete(
  projectId: string,
  name: string | undefined,
  flags: { force?: boolean },
): Promise<number> {
  if (!name) {
    console.error(chalk.red("\nNo skill name specified."));
    console.error(
      chalk.gray(`Usage: ${chalk.cyan("tambo skills delete <name>")}`),
    );
    return 1;
  }

  const spinner = ora("Fetching skill...").start();

  let skill: Skill | undefined;
  try {
    const skills = await api.skills.list.query({ projectId });
    skill = skills.find((s) => s.name === name);
  } catch (error) {
    spinner.fail("Failed to fetch skills");
    logApiError(error);
    return 1;
  }

  if (!skill) {
    spinner.fail(`Skill '${name}' not found.`);
    console.error(
      chalk.gray(
        `Run ${chalk.cyan("tambo skills list")} to see available skills.`,
      ),
    );
    return 1;
  }

  spinner.stop();

  if (!flags.force) {
    if (!isInteractive()) {
      throw new GuidanceError("Deleting a skill requires confirmation.", [
        `npx tambo skills delete ${name} --force  # Delete without confirmation`,
      ]);
    }

    const confirmed = await confirm({
      message: `Delete skill '${name}'? This cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.gray("Cancelled."));
      return 0;
    }
  }

  const deleteSpinner = ora("Deleting skill...").start();
  try {
    await api.skills.delete.mutate({ projectId, skillId: skill.id });
    deleteSpinner.succeed(`Deleted skill: ${chalk.cyan(name)}`);
    return 0;
  } catch (error) {
    deleteSpinner.fail("Failed to delete skill");
    logApiError(error);
    return 1;
  }
}

// ============================================================================
// Error Helpers
// ============================================================================

function isConflictError(error: unknown): boolean {
  if (!(error instanceof Error) || !("data" in error)) return false;
  const data = (error as { data: unknown }).data;
  return (
    data !== null &&
    typeof data === "object" &&
    "code" in data &&
    (data as { code: unknown }).code === "CONFLICT"
  );
}

function logApiError(error: unknown): void {
  if (isAuthError(error)) {
    console.error(
      chalk.gray(
        `Session expired. Run ${chalk.cyan("tambo auth login")} to re-authenticate.`,
      ),
    );
  } else if (error instanceof Error) {
    console.error(chalk.gray(`  ${error.message}`));
  }
}

// ============================================================================
// Main Handler & Help
// ============================================================================

/**
 * Main skills command handler -- routes to subcommands.
 * @returns Calls process.exit on non-zero exit code.
 */
export async function handleSkills(
  subcommand: string | undefined,
  args: string[],
  flags: {
    force?: boolean;
  },
): Promise<void> {
  let exitCode = 0;

  if (!subcommand || subcommand === "help") {
    showSkillsHelp();
    return;
  }

  // Resolve project ID upfront (all subcommands need it)
  let projectId: string;
  try {
    projectId = await resolveProjectId();
  } catch {
    process.exit(1);
    return;
  }

  switch (subcommand) {
    case "list":
      exitCode = await handleList(projectId);
      break;
    case "add":
      exitCode = await handleAdd(projectId, args);
      break;
    case "get":
      exitCode = await handleGet(projectId, args[0]);
      break;
    case "update":
      exitCode = await handleUpdate(projectId, args);
      break;
    case "delete":
      exitCode = await handleDelete(projectId, args[0], {
        force: flags.force,
      });
      break;
    default:
      console.log(chalk.red(`Unknown skills subcommand: ${subcommand}`));
      showSkillsHelp();
      exitCode = 1;
  }

  trackEvent(EVENTS.COMMAND_COMPLETED, {
    command: "skills",
    subcommand,
    success: exitCode === 0,
  });

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

/**
 * Show skills command help
 */
export function showSkillsHelp(): void {
  console.log(`
${chalk.bold("tambo skills")} - Manage project skills

${chalk.bold("Usage")}
  $ ${chalk.cyan("tambo skills")} <subcommand> [options]

${chalk.bold("Subcommands")}
  ${chalk.yellow("list")}              List all skills in the project
  ${chalk.yellow("add")} <file.md>     Create a skill from a markdown file
  ${chalk.yellow("get")} <name>        Print a skill as markdown to stdout
  ${chalk.yellow("update")} <file.md>  Update an existing skill from a file
  ${chalk.yellow("delete")} <name>     Delete a skill by name

${chalk.bold("Options")}
  ${chalk.yellow("--force, -f")}       Skip confirmation prompts (delete only)

${chalk.bold("Skill File Format")}
  Files use YAML frontmatter with a name and description:

  ${chalk.gray("---")}
  ${chalk.gray("name: my-skill-name")}
  ${chalk.gray('description: "A brief description"')}
  ${chalk.gray("---")}
  ${chalk.gray("Instructions content here...")}

${chalk.bold("Examples")}
  $ ${chalk.cyan("tambo skills list")}
  $ ${chalk.cyan("tambo skills add my-skill.md")}
  $ ${chalk.cyan("tambo skills add skill1.md skill2.md")}
  $ ${chalk.cyan("tambo skills get my-skill-name")}
  $ ${chalk.cyan("tambo skills get my-skill-name > my-skill.md")}
  $ ${chalk.cyan("tambo skills update my-skill.md")}
  $ ${chalk.cyan("tambo skills delete my-skill-name")}
  $ ${chalk.cyan("tambo skills delete my-skill-name --force")}

${chalk.bold("Requirements")}
  Requires authentication (${chalk.cyan("tambo auth login")}) and a project
  API key (${chalk.cyan("tambo init")}).
`);
}
