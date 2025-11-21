import chalk from "chalk";
import fs from "fs";
import path from "path";
import { isInteractive } from "../../utils/interactive.js";
import { upgradeComponents } from "./components.js";
import { upgradeAgentDocsAndRemoveCursorRules } from "./llm-rules.js";
import { upgradeNpmPackages } from "./npm-packages.js";
import { detectTemplate, generateAiUpgradePrompts } from "./utils.js";

export interface UpgradeOptions {
  legacyPeerDeps?: boolean;
  acceptAll?: boolean;
  silent?: boolean;
  prefix?: string;
  yes?: boolean;
  skipAgentDocs?: boolean;
}

/**
 * Main upgrade handler function
 */
export async function handleUpgrade(
  options: UpgradeOptions = {},
): Promise<void> {
  console.log(chalk.cyan("\n🔄 Tambo Upgrade Tool\n"));

  // Check for interactivity early - upgrade requires running external commands
  if (!isInteractive() && !options.yes) {
    throw new Error(
      `${chalk.red("Error: Upgrade command requires an interactive environment or --yes flag.")}\n\n` +
        `${chalk.yellow("Reason:")} This command runs external commands (npm, npx) that require user confirmation.\n\n` +
        `${chalk.blue("Solutions:")}\n` +
        `  1. Run in an interactive terminal (not piped)\n` +
        `  2. Use ${chalk.cyan("--yes")} flag to auto-approve all changes\n` +
        `  3. Use ${chalk.cyan("--accept-all")} flag to skip all prompts\n\n` +
        `Example: ${chalk.cyan("tambo upgrade --yes")}`,
    );
  }

  try {
    // Check if we're in a tambo project
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(
        "No package.json found. Make sure you're in a tambo project.",
      );
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const hasTamboDep =
      packageJson.dependencies &&
      (packageJson.dependencies["@tambo-ai/react"] ??
        packageJson.dependencies.tambo);

    if (!hasTamboDep) {
      console.log(
        chalk.yellow(
          "Warning: This doesn't appear to be a tambo project. Proceeding anyway.",
        ),
      );
    }

    // Detect template
    const detectedTemplate = await detectTemplate();
    if (detectedTemplate) {
      console.log(
        chalk.blue(`Detected template: ${chalk.cyan(detectedTemplate)}`),
      );
    }

    // Upgrade packages
    console.log(chalk.bold("\n1. Upgrading npm packages\n"));
    const npmSuccess = await upgradeNpmPackages(options);
    if (!npmSuccess) {
      console.error(chalk.red("\n❌ NPM package upgrade failed"));
      process.exit(1);
    }

    // Agent docs + cursor rule upgrade
    console.log(chalk.bold("\n2. Agent docs and cursor rules\n"));
    const rulesSuccess = await upgradeAgentDocsAndRemoveCursorRules(options);
    if (!rulesSuccess) {
      console.error(chalk.red("\n❌ Agent docs/cursor rules failed"));
      process.exit(1);
    }

    // Upgrade components
    console.log(chalk.bold("\n3. Upgrading tambo components\n"));
    const componentsSuccess = await upgradeComponents(options);
    if (!componentsSuccess) {
      console.error(chalk.red("\n❌ Component upgrade failed"));
      process.exit(1);
    }

    // Generate AI upgrade prompts
    console.log(chalk.bold("\n4. AI Upgrade Prompts\n"));
    console.log(
      chalk.gray(
        "Use these prompts with AI to further upgrade your tambo app:",
      ),
    );

    const prompts = generateAiUpgradePrompts(detectedTemplate);
    prompts.forEach((prompt, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${prompt}`));
    });

    console.log(chalk.green("\n✅ Tambo upgrade complete!\n"));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n❌ Upgrade failed: ${errorMessage}`));
    process.exit(1);
  }
}
