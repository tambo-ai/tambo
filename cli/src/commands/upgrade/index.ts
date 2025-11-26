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
      `${chalk.red("Error: Cannot run 'tambo upgrade' in non-interactive mode without flags.")}\n\n` +
        `${chalk.yellow("What happened:")} This command needs to prompt you for choices, but your environment\n` +
        `doesn't support prompts (likely CI/CD, Docker, or piped output).\n\n` +
        `${chalk.blue("Required flag:")}\n` +
        `  ${chalk.cyan("--yes")} ${chalk.dim("Auto-accepts all upgrades and skips prompts")}\n\n` +
        `${chalk.blue("Other available flags:")}\n` +
        `  ${chalk.cyan("--prefix <path>")} ${chalk.dim("Component directory (default: src/components/tambo)")}\n` +
        `  ${chalk.cyan("--skip-agent-docs")} ${chalk.dim("Skip updating AGENTS.md/CLAUDE.md files")}\n` +
        `  ${chalk.cyan("--legacy-peer-deps")} ${chalk.dim("Pass --legacy-peer-deps to npm (fixes some conflicts)")}\n\n` +
        `${chalk.blue("Examples:")}\n` +
        `  ${chalk.cyan("tambo upgrade --yes")}                                  ${chalk.dim("# Standard components path")}\n` +
        `  ${chalk.cyan("tambo upgrade --yes --prefix src/components/ui")}       ${chalk.dim("# Custom components path")}\n` +
        `  ${chalk.cyan("tambo upgrade --yes --skip-agent-docs")}                ${chalk.dim("# Skip docs updates")}\n` +
        `  ${chalk.cyan("tambo upgrade --yes --legacy-peer-deps")}               ${chalk.dim("# Fix peer dep conflicts")}\n\n` +
        chalk.dim(
          "Or run this command in an interactive terminal (not in CI/CD).",
        ),
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
