import path from "path";

import type { CommandSuggestion } from "./output.js";
import type { ProjectStatus } from "./project-detection.js";

interface GuidanceCommand {
  command: string;
  description: string;
  needed?: boolean;
}

export interface Guidance {
  description: string;
  stepsNeeded?: string[];
  commands: GuidanceCommand[];
  allInOne?: {
    command: string;
    description: string;
  };
}

function getInstallCommand(pm: ProjectStatus["packageManager"]): string {
  switch (pm) {
    case "pnpm":
      return "pnpm add @tambo-ai/react";
    case "yarn":
      return "yarn add @tambo-ai/react";
    case "bun":
      return "bun add @tambo-ai/react";
    default:
      return "npm install @tambo-ai/react";
  }
}

function getInitProjectName(projectName?: string): string {
  return projectName ?? path.basename(process.cwd());
}

export function buildInitGuidance(
  status: ProjectStatus,
  projectName?: string,
): Guidance {
  const stepsNeeded: string[] = [];
  const commands: GuidanceCommand[] = [];
  const resolvedProjectName = getInitProjectName(projectName);

  if (!status.hasTamboReact) {
    stepsNeeded.push("Install @tambo-ai/react");
    commands.push({
      command: getInstallCommand(status.packageManager),
      description: "Install Tambo React SDK",
      needed: true,
    });
  }

  if (!status.authenticated && !status.hasApiKey) {
    stepsNeeded.push("Authenticate with Tambo Cloud");
    commands.push({
      command: "tambov1 auth login",
      description: "Authenticate with Tambo Cloud",
      needed: true,
    });
  }

  if (!status.hasApiKey) {
    stepsNeeded.push("Create project and generate API key");
    commands.push({
      command: `tambov1 project create ${resolvedProjectName}`,
      description: "Create project in Tambo Cloud",
      needed: true,
    });
    commands.push({
      command: "tambov1 project api-key <project-id>",
      description:
        "Generate and save API key (use project ID from previous step)",
      needed: true,
    });
  }

  if (!status.hasTamboTs) {
    stepsNeeded.push("Create config files");
    commands.push({
      command: "tambov1 init config",
      description: "Create tambo.ts",
      needed: true,
    });
  }

  if (!status.hasAgentDocs) {
    commands.push({
      command: "tambov1 init skill",
      description: "Install tambo skill",
      needed: true,
    });
  }

  return {
    description: "Initialize Tambo in this project",
    stepsNeeded: stepsNeeded.length > 0 ? stepsNeeded : undefined,
    commands: commands.filter((command) => command.needed),
    allInOne: {
      command: `tambov1 init --yes --project-name=${resolvedProjectName}`,
      description: "Run full initialization non-interactively",
    },
  };
}

export function buildCreateAppGuidance(): {
  description: string;
  templates: Array<{ name: string; description: string }>;
  commands: CommandSuggestion[];
  options: Record<string, string>;
} {
  return {
    description: "Create a new Tambo app from a template",
    templates: [
      {
        name: "standard",
        description: "Tambo + Tools + MCP (recommended)",
      },
      {
        name: "analytics",
        description: "Generative UI Analytics Template",
      },
    ],
    commands: [
      {
        command: "tambov1 create-app my-app --template=standard",
        description: "Create app with standard template",
      },
      {
        command: "tambov1 create-app my-app --template=analytics",
        description: "Create app with analytics template",
      },
    ],
    options: {
      "--install-deps": "Install dependencies (default: true)",
      "--no-install-deps": "Skip dependency installation",
      "--init-git": "Initialize git repository",
      "--json": "Output results as JSON",
    },
  };
}
