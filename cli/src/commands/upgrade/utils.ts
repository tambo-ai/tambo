import chalk from "chalk";
import fs from "fs";
import path from "path";

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
    if (readmeContent.includes("Tambo MCP Template")) {
      return "mcp";
    }

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
    mcp: [
      "How can I improve the MCP integration in my tambo application?",
      "What are best practices for state management in a tambo MCP application?",
    ],
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
