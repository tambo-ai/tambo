/**
 * Project commands - Manage Tambo Cloud projects
 *
 * Subcommands:
 * - list: List all projects
 * - create: Create a new project
 * - api-key: Generate an API key for a project
 */

import { defineCommand } from "citty";
import path from "path";
import ora from "ora";

import { api } from "../lib/api-client.js";

import { requireAuthentication } from "../utils/auth-helpers.js";
import { writeApiKeyToEnv } from "../utils/env-helpers.js";
import { getSafeErrorMessage } from "../utils/error-helpers.js";
import { out } from "../utils/output.js";
import { isTTY } from "../utils/tty.js";

// ============================================================================
// PROJECT LIST
// ============================================================================

interface ProjectListResult {
  success: boolean;
  authenticated: boolean;
  projects: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
  errors: string[];
}

const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List all Tambo projects",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: ProjectListResult = {
      success: false,
      authenticated: false,
      projects: [],
      errors: [],
    };

    if (!args.json) {
      out.header("TAMBO PROJECTS");
    }

    // Check authentication
    const isAuthenticated = await requireAuthentication(args, result);
    if (!isAuthenticated) {
      process.exit(1);
    }

    // Fetch projects
    const fetchSpinner =
      args.json || !isTTY() ? null : ora("Fetching projects...").start();

    try {
      const projects = await api.project.getUserProjects.query({});
      fetchSpinner?.succeed(`Found ${projects.length} project(s)`);

      result.projects = projects.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt.toISOString(),
      }));
      result.success = true;

      if (args.json) {
        out.json(result);
      } else {
        if (projects.length === 0) {
          out.info("No projects found.");
          out.nextCommands([
            {
              command: "tambov1 project create my-project",
              description: "Create your first project",
            },
          ]);
        } else {
          out.subheader("YOUR PROJECTS");
          projects.forEach((p) => {
            out.keyValue(p.name, p.id);
          });
          out.nextCommands([
            {
              command: "tambov1 project api-key <project-id>",
              description: "Generate an API key for a project",
            },
            {
              command: "tambov1 project create <name>",
              description: "Create a new project",
            },
          ]);
        }
      }
    } catch (error) {
      fetchSpinner?.fail("Failed to fetch projects");
      const safeMessage = getSafeErrorMessage(error);
      result.errors.push(`Failed to fetch projects: ${safeMessage}`);
      if (args.json) {
        out.json(result);
      } else {
        out.error(`Failed to fetch projects: ${safeMessage}`);
      }
      process.exit(1);
    }
  },
});

// ============================================================================
// PROJECT CREATE
// ============================================================================

interface ProjectCreateResult {
  success: boolean;
  authenticated: boolean;
  project?: {
    id: string;
    name: string;
  };
  errors: string[];
}

const createCommand = defineCommand({
  meta: {
    name: "create",
    description: "Create a new Tambo project",
  },
  args: {
    name: {
      type: "positional",
      description: "Project name (defaults to current directory name)",
      required: false,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const projectName = args.name ?? path.basename(process.cwd());

    const result: ProjectCreateResult = {
      success: false,
      authenticated: false,
      errors: [],
    };

    if (!args.json) {
      out.header("CREATE PROJECT");
      out.keyValue("Project name", projectName);
    }

    // Check authentication
    const isAuthenticated = await requireAuthentication(args, result);
    if (!isAuthenticated) {
      process.exit(1);
    }

    // Create project
    const createSpinner =
      args.json || !isTTY() ? null : ora("Creating project...").start();

    try {
      const project = await api.project.createProject2.mutate({
        name: projectName,
      });

      createSpinner?.succeed(`Created project: ${project.name}`);

      result.success = true;
      result.project = {
        id: project.id,
        name: project.name,
      };

      if (args.json) {
        out.json(result);
      } else {
        out.keyValue("Project ID", project.id);
        out.nextCommands([
          {
            command: `tambov1 project api-key ${project.id}`,
            description: "Generate an API key for this project",
          },
        ]);
      }
    } catch (error) {
      createSpinner?.fail("Failed to create project");
      const safeMessage = getSafeErrorMessage(error);
      result.errors.push(`Failed to create project: ${safeMessage}`);
      if (args.json) {
        out.json(result);
      } else {
        out.error(`Failed to create project: ${safeMessage}`);
      }
      process.exit(1);
    }
  },
});

// ============================================================================
// PROJECT API-KEY
// ============================================================================

interface ApiKeyResult {
  success: boolean;
  authenticated: boolean;
  projectId: string;
  apiKeySet: boolean;
  envFile?: string;
  errors: string[];
}

const apiKeyCommand = defineCommand({
  meta: {
    name: "api-key",
    description: "Generate an API key for a project",
  },
  args: {
    projectId: {
      type: "positional",
      description: "Project ID to generate key for",
      required: true,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
    "no-save": {
      type: "boolean",
      description: "Don't save to .env file, just output the key",
      default: false,
    },
  },
  async run({ args }) {
    const result: ApiKeyResult = {
      success: false,
      authenticated: false,
      projectId: args.projectId,
      apiKeySet: false,
      errors: [],
    };

    if (!args.json) {
      out.header("GENERATE API KEY");
      out.keyValue("Project ID", args.projectId);
    }

    // Check authentication
    const isAuthenticated = await requireAuthentication(args, result);
    if (!isAuthenticated) {
      process.exit(1);
    }

    // Generate API key
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const keySpinner =
      args.json || !isTTY() ? null : ora("Generating API key...").start();

    try {
      const keyResult = await api.project.generateApiKey.mutate({
        projectId: args.projectId,
        name: `CLI Key (${timestamp})`,
      });

      keySpinner?.succeed("API key generated");

      result.apiKeySet = true;
      result.success = true;

      // Save to .env unless --no-save
      if (!args["no-save"]) {
        const envResult = writeApiKeyToEnv(keyResult.apiKey, {
          jsonMode: args.json,
        });
        result.envFile = envResult.envFile;
      }

      if (args.json) {
        // Never include the full API key in JSON output to prevent exposure in logs
        out.json(result);
      } else {
        if (args["no-save"]) {
          // Terminal output is fine since user explicitly asked for it
          out.keyValue("API Key", keyResult.apiKey);
          out.warning("Key not saved to .env (--no-save flag)");
        } else {
          out.success(`API key saved to ${result.envFile}`);
        }
        out.nextCommands([
          {
            command: "tambov1 init",
            description: "Initialize local Tambo files",
          },
        ]);
      }
    } catch (error) {
      keySpinner?.fail("Failed to generate API key");
      const safeMessage = getSafeErrorMessage(error);
      result.errors.push(`Failed to generate API key: ${safeMessage}`);
      if (args.json) {
        out.json(result);
      } else {
        out.error(`Failed to generate API key: ${safeMessage}`);
      }
      process.exit(1);
    }
  },
});

// ============================================================================
// MAIN PROJECT COMMAND
// ============================================================================

export const project = defineCommand({
  meta: {
    name: "project",
    description: "Manage Tambo Cloud projects",
  },
  subCommands: {
    list: listCommand,
    create: createCommand,
    "api-key": apiKeyCommand,
  },
});
