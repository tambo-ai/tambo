/**
 * Init command - Add Tambo to an existing project
 *
 * Subcommands for granular control:
 * - config: Create tambo.ts configuration file only
 * - skill: Install tambo skill for AI agents
 */

import { defineCommand } from "citty";

import { buildInitGuidance } from "../../utils/guidance.js";
import { out } from "../../utils/output.js";
import { detectProjectStatus } from "../../utils/project-detection.js";
import { requirePackageJson } from "../../utils/project-helpers.js";
import { isTTY } from "../../utils/tty.js";
import { configCommand } from "./config.js";
import {
  checkApiKey,
  createAgentDocs,
  createInitResult,
  createProjectAndApiKey,
  createTamboConfigFile,
  displayProjectStatus,
  exitOnError,
  handleAuthentication,
  installTamboReact,
  outputInitResults,
  promptForProjectName,
} from "./helpers.js";
import { skillCommand } from "./skill.js";

// Re-export for backwards compatibility
export { getInstallationPath } from "./helpers.js";

export const init = defineCommand({
  meta: {
    name: "init",
    description: "Add Tambo to this project",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
    prefix: {
      type: "string",
      description: "Custom directory prefix for components",
      default: "src/components",
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Run non-interactively (requires --project-name)",
      default: false,
    },
    "project-name": {
      type: "string",
      description: "Project name for Tambo Cloud",
      required: false,
    },
    "skip-agent-docs": {
      type: "boolean",
      description: "Skip installing tambo skill",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Show what would happen without making changes",
      default: false,
    },
  },
  async run({ args }) {
    // Skip parent run when a subcommand is being executed
    // citty calls parent run even when subcommand matches
    const rawArgs = process.argv.slice(2);
    const initIndex = rawArgs.indexOf("init");
    if (
      initIndex !== -1 &&
      (rawArgs[initIndex + 1] === "config" ||
        rawArgs[initIndex + 1] === "skill")
    ) {
      return;
    }

    const result = createInitResult();
    const jsonMode = args.json;
    const isDryRun = args["dry-run"];
    const projectRoot = process.cwd();
    const isInteractive = isTTY();

    // Validate project structure
    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    // Detect current project status
    const status = await detectProjectStatus(projectRoot, args.prefix);

    // Handle non-interactive mode without --yes flag
    if (!isInteractive && !args.yes) {
      const guidance = buildInitGuidance(status, args["project-name"]);
      out.json({
        success: false,
        reason: "interactive_required",
        status,
        guidance,
      });
      return;
    }

    // Validate required args in non-interactive mode
    if (args.yes && !args["project-name"] && !status.hasApiKey) {
      result.errors.push("--project-name is required when running with --yes");
      out.json(result);
      process.exit(1);
    }

    // Display status to user
    if (!jsonMode) {
      displayProjectStatus(status);
    }

    // Copy existing status to result
    result.tamboReactInstalled = status.hasTamboReact;
    result.authenticated = status.authenticated;

    // Step 1: Install @tambo-ai/react if needed
    if (!status.hasTamboReact) {
      await installTamboReact(result, jsonMode, isInteractive, isDryRun);
    }
    exitOnError(result, jsonMode);

    // Step 2: Handle authentication and project creation if no API key
    const apiKeyCheck = checkApiKey(true);
    const hasApiKey = status.hasApiKey || apiKeyCheck.found;

    if (!hasApiKey) {
      // Authenticate if needed
      if (!status.authenticated) {
        await handleAuthentication(result, jsonMode, isDryRun);
      }
      exitOnError(result, jsonMode);

      // Get project name and create project
      const projectName = await promptForProjectName(
        args["project-name"],
        isInteractive,
      );

      if (!projectName) {
        result.errors.push("Project name is required to create a project");
      } else if (result.errors.length === 0) {
        result.projectName = projectName;
        try {
          await createProjectAndApiKey(projectName, result, jsonMode, isDryRun);
        } catch (error) {
          result.errors.push(String(error));
        }
      }
    }
    exitOnError(result, jsonMode);

    // Step 3: Create tambo.ts config file
    createTamboConfigFile(result, projectRoot, args.prefix, jsonMode, isDryRun);

    // Step 4: Create agent docs
    await createAgentDocs(
      result,
      args.prefix,
      jsonMode,
      isDryRun,
      args["skip-agent-docs"],
    );

    // Output results
    outputInitResults(result, jsonMode);

    if (!result.success) {
      process.exit(1);
    }
  },
  subCommands: {
    config: configCommand,
    skill: skillCommand,
  },
});
