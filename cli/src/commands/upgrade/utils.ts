import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import { updateImportPaths } from "../migrate.js";

/**
 * Determines which template is being used in the current project
 */
export async function detectTemplate(): Promise<string | null> {
  try {
    const projectRoot = process.cwd();
    const readmePath = path.join(projectRoot, "README.md");

    if (!fs.existsSync(readmePath)) {
      console.log(
        chalk.yellow("No README.md found. Unable to determine template type."),
      );
      return null;
    }

    // Read README content
    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    // Check for template-specific names in the README
    if (readmeContent.includes("Tambo Conversational Form Template")) {
      return "conversational-form";
    }

    if (readmeContent.includes("Tambo Template")) {
      return "standard";
    }

    console.log(chalk.yellow("Template type not identified in README.md."));
    return null;
  } catch (error) {
    console.error(chalk.yellow("Unable to detect template type: ", error));
    return null;
  }
}

/**
 * Generate AI upgrade prompts based on project template
 */
export function generateAiUpgradePrompts(template: string | null): string[] {
  const commonPrompts = [
    "How can I optimize my tambo components for better performance?",
    "What improvements can be made to the user interface based on best practices?",
    "Suggest ways to enhance the accessibility of my tambo app",
  ];

  const templateSpecificPrompts: Record<string, string[]> = {
    "conversational-form": [
      "How can I make my conversational interfaces more intuitive?",
      "What are recommended patterns for handling complex conversational flows?",
    ],
    standard: [
      "How can I optimize the state management in my tambo application?",
      "What are the latest patterns for error handling in tambo components?",
    ],
  };

  const specificPrompts = template
    ? templateSpecificPrompts[template] || []
    : [];

  return [...commonPrompts, ...specificPrompts];
}

/**
 * For backward compatibility with older Node versions
 */
export async function safeFetch(url: string): Promise<Response> {
  try {
    // Try using global fetch (available in Node.js 18+)
    return await fetch(url);
  } catch (_error) {
    // If global fetch isn't available, try to dynamically import node-fetch
    try {
      const nodeFetch = await import("node-fetch");
      return (await nodeFetch.default(url)) as unknown as Response;
    } catch (_importError) {
      // If node-fetch isn't installed, provide helpful error
      throw new Error(
        `Failed to fetch from ${url}. This CLI requires Node.js v18+ or the 'node-fetch' package. ` +
          `Please upgrade Node.js or install node-fetch: npm install node-fetch`,
      );
    }
  }
}

/**
 * Prompts the user for confirmation with a yes/no question
 * @param message The message to display in the prompt
 * @param defaultValue Default answer (true=yes, false=no)
 * @returns Promise<boolean> True if user confirmed, false otherwise
 */
export async function confirmAction(
  message: string,
  defaultValue = true,
): Promise<boolean> {
  const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: chalk.yellow(message),
    default: defaultValue,
  });

  return confirm;
}

export async function migrateComponentsDuringUpgrade(
  componentNames: string[],
  installPath: string,
): Promise<void> {
  const spinner = ora("Migrating components to new location...").start();

  try {
    const legacyPath = path.join(
      process.cwd(),
      installPath,
      LEGACY_COMPONENT_SUBDIR,
    );
    const newPath = path.join(process.cwd(), installPath, COMPONENT_SUBDIR);

    // Create new directory
    fs.mkdirSync(newPath, { recursive: true });

    for (const componentName of componentNames) {
      const oldFile = path.join(legacyPath, `${componentName}.tsx`);
      const newFile = path.join(newPath, `${componentName}.tsx`);

      if (fs.existsSync(oldFile)) {
        // Read, update import paths, write to new location
        const content = fs.readFileSync(oldFile, "utf-8");
        const updatedContent = updateImportPaths(content, "tambo");
        fs.writeFileSync(newFile, updatedContent);
        fs.unlinkSync(oldFile);
      }
    }

    spinner.succeed(
      `Migrated ${componentNames.length} components to ${COMPONENT_SUBDIR}/`,
    );
  } catch (error) {
    spinner.fail(`Migration failed: ${error}`);
    throw error;
  }
}
