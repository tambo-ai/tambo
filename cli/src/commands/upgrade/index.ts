import chalk from "chalk";
import fs from "fs";
import path from "path";
import { upgradeComponents } from "./components.js";
import { upgradeLlmRules } from "./llm-rules.js";
import { upgradeNpmPackages } from "./npm-packages.js";
import { detectTemplate, generateAiUpgradePrompts } from "./utils.js";

export interface UpgradeOptions {
  legacyPeerDeps?: boolean;
  acceptAll?: boolean;
  silent?: boolean;
}

/**
 * Main upgrade handler function
 */
export async function handleUpgrade(
  options: UpgradeOptions = {},
): Promise<void> {
  console.log(chalk.cyan("\n🔄 Tambo Upgrade Tool\n"));

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

    // Upgrade LLM rules
    console.log(chalk.bold("\n2. Upgrading cursor rules\n"));
    const rulesSuccess = await upgradeLlmRules(detectedTemplate, options);
    if (!rulesSuccess) {
      console.error(chalk.red("\n❌ Cursor rules upgrade failed"));
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
