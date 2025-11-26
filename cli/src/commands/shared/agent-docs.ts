import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { COMPONENT_SUBDIR } from "../../constants/paths.js";

const TAMBO_SECTION_VERSION = "v1.0";
const VERSION_MARKER = `<!-- tambo-docs-${TAMBO_SECTION_VERSION} -->`;

const TAMBO_DOCS_SECTION = `
${VERSION_MARKER}
## Tambo AI Framework

This project uses **Tambo AI** for building AI assistants with generative UI and MCP support.

**Documentation**: https://docs.tambo.co/llms.txt

**CLI**: Use \`npx tambo\` to add UI components or upgrade. Run \`npx tambo help\` to learn more.
`;

const COMPONENT_AGENTS_TEMPLATE = `# Tambo Components Guidelines

Components in this directory are registered with Tambo for AI-driven generative UI.

Read the full documentation at https://docs.tambo.co/llms.txt for component creation patterns and best practices.
`;

export interface AgentDocsOptions {
  yes?: boolean;
  skipPrompt?: boolean;
  prefix?: string;
  skipAgentDocs?: boolean;
}

function hasTamboSection(content: string): boolean {
  return content.includes(VERSION_MARKER);
}

function getComponentDir(prefix?: string): string {
  const root = process.cwd();

  // Standard paths to check (in order of preference)
  const srcPath = path.join(root, "src", "components", COMPONENT_SUBDIR);
  const rootPath = path.join(root, "components", COMPONENT_SUBDIR);

  // If prefix is provided, it's an explicit CLI --prefix flag
  // The prefix specifies the exact location where components are installed
  if (prefix) {
    const prefixPath = path.join(root, prefix);
    // Check if it already ends with the component subdir
    if (prefix.endsWith(COMPONENT_SUBDIR)) {
      return prefixPath;
    }
    // Otherwise append COMPONENT_SUBDIR
    return path.join(prefixPath, COMPONENT_SUBDIR);
  }

  // Auto-detect: check standard locations
  if (fs.existsSync(srcPath)) return srcPath;
  if (fs.existsSync(rootPath)) return rootPath;
  return srcPath;
}

export async function handleAgentDocsUpdate(
  options: AgentDocsOptions = {},
): Promise<void> {
  if (options.skipAgentDocs) return;

  const root = process.cwd();
  const agentsMdPath = path.join(root, "AGENTS.md");
  const claudeMdPath = path.join(root, "CLAUDE.md");
  const componentDir = getComponentDir(options.prefix);

  const hasAgents = fs.existsSync(agentsMdPath);
  const hasClaude = fs.existsSync(claudeMdPath);

  if (!options.yes && !options.skipPrompt) {
    const isNonInteractive = !process.stdin?.isTTY || process.env.CI === "true";

    if (isNonInteractive) {
      console.log(
        chalk.gray("Non-interactive mode: auto-creating agent documentation"),
      );
    } else {
      const { proceed } = await inquirer.prompt({
        type: "confirm",
        name: "proceed",
        message:
          "Would you like to update/add AGENTS.md and CLAUDE.md for LLMs?",
        default: true,
      });

      if (!proceed) {
        console.log(chalk.gray("Skipping agent documentation"));
        return;
      }
    }
  }

  const spinner = ora("Setting up agent documentation...").start();

  try {
    const updates: string[] = [];

    if (hasAgents) {
      const content = fs.readFileSync(agentsMdPath, "utf-8");
      if (!hasTamboSection(content)) {
        fs.appendFileSync(agentsMdPath, `\n\n${TAMBO_DOCS_SECTION}`);
        updates.push("Updated AGENTS.md");
      } else {
        updates.push("AGENTS.md already up-to-date");
      }
    } else if (hasClaude) {
      const content = fs.readFileSync(claudeMdPath, "utf-8");
      if (!hasTamboSection(content)) {
        fs.appendFileSync(claudeMdPath, `\n\n${TAMBO_DOCS_SECTION}`);
        updates.push("Updated CLAUDE.md");
      } else {
        updates.push("CLAUDE.md already up-to-date");
      }
    } else {
      fs.writeFileSync(
        agentsMdPath,
        `# AGENTS.md\n\nProject guidelines for AI assistants.\n\n${TAMBO_DOCS_SECTION}`,
      );
      updates.push("Created AGENTS.md");
    }

    const componentAgentsPath = path.join(componentDir, "AGENTS.md");
    fs.mkdirSync(componentDir, { recursive: true });

    if (!fs.existsSync(componentAgentsPath)) {
      fs.writeFileSync(componentAgentsPath, COMPONENT_AGENTS_TEMPLATE);
      updates.push("Created component AGENTS.md");
    } else {
      const existingContent = fs.readFileSync(componentAgentsPath, "utf-8");
      // Check if content matches the current template
      if (existingContent.trim() !== COMPONENT_AGENTS_TEMPLATE.trim()) {
        // Old version or user-modified, update it
        // TODO: Consider adding prompting or merge strategy in the future to preserve
        // user customizations when overwriting component AGENTS.md files
        console.log(
          chalk.yellow(
            `⚠  Updating components/tambo/AGENTS.md to version ${TAMBO_SECTION_VERSION}`,
          ),
        );
        fs.writeFileSync(componentAgentsPath, COMPONENT_AGENTS_TEMPLATE);
        updates.push("Updated component AGENTS.md");
      } else {
        updates.push("Component AGENTS.md up-to-date");
      }
    }

    spinner.succeed(`Agent docs: ${updates.join(", ")}`);
  } catch (error) {
    spinner.fail(
      `Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}
