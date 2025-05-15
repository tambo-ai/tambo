import fs from "fs";
import ora from "ora";
import path from "path";
import type { UpgradeOptions } from "./index.js";
import { confirmAction, safeFetch } from "./utils.js";

/**
 * Upgrade LLM rules in .cursor/rules folder based on template
 */
export async function upgradeLlmRules(
  template: string | null,
  options: UpgradeOptions,
): Promise<boolean> {
  const spinner = ora("Upgrading LLM rules...").start();

  try {
    const rulesDir = path.join(process.cwd(), ".cursor", "rules");

    // Check if .cursor/rules directory exists
    if (!fs.existsSync(rulesDir)) {
      spinner.info("No .cursor/rules directory found. Creating one...");
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    if (!template) {
      spinner.warn("Could not detect template type. Skipping rules upgrade.");
      return true;
    }

    // Define GitHub repository path for rules based on template
    let repoRulesPath: string;

    switch (template) {
      case "mcp":
        repoRulesPath =
          "https://api.github.com/repos/tambo-ai/mcp-template/contents/.cursor/rules";
        break;
      case "conversational-form":
        repoRulesPath =
          "https://api.github.com/repos/tambo-ai/conversational-form/contents/.cursor/rules";
        break;
      case "standard":
        repoRulesPath =
          "https://api.github.com/repos/tambo-ai/tambo-template/contents/.cursor/rules";
        break;
      default:
        spinner.warn(
          `Unknown template type: ${template}. Skipping rules upgrade.`,
        );
        return true;
    }

    // Fetch rules from GitHub using our safeFetch wrapper
    const response = await safeFetch(repoRulesPath);
    if (!response.ok) {
      spinner.fail(`Failed to fetch rules from GitHub: ${response.statusText}`);
      return false;
    }

    const files = await response.json();
    let updatedFiles = 0;

    // Compare and update rules
    for (const file of files) {
      const fileResponse = await safeFetch(file.download_url);
      if (!fileResponse.ok) continue;

      const templateContent = await fileResponse.text();
      const localFilePath = path.join(rulesDir, file.name);

      // If file doesn't exist locally or content is different
      if (
        !fs.existsSync(localFilePath) ||
        fs.readFileSync(localFilePath, "utf-8") !== templateContent
      ) {
        if (!options.acceptAll && fs.existsSync(localFilePath)) {
          const proceed = await confirmAction(
            `Update cursor rule file: ${file.name}?`,
            true,
          );

          if (!proceed) continue;
        }

        fs.writeFileSync(localFilePath, templateContent);
        updatedFiles++;
      }
    }

    spinner.succeed(
      `Cursor rules upgrade complete. Updated ${updatedFiles} file(s).`,
    );
    return true;
  } catch (error) {
    spinner.fail(`Failed to upgrade LLM rules: ${error}`);
    return false;
  }
}
