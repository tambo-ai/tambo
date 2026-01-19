/**
 * Init skill subcommand - Install tambo skill for AI agents
 */

import { defineCommand } from "citty";

import { getSafeErrorMessage } from "../../utils/error-helpers.js";
import { out } from "../../utils/output.js";
import { requirePackageJson } from "../../utils/project-helpers.js";
import { installSkill } from "../shared/skill-install.js";
import type { AgentDocsResult } from "./types.js";

export const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description: "Install tambo skill for AI agents",
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
  },
  async run({ args }) {
    const result: AgentDocsResult = {
      success: false,
      skillInstalled: false,
      errors: [],
      warnings: [],
      filesCreated: [],
      filesModified: [],
    };

    if (!args.json) {
      out.header("INSTALL SKILL");
      out.explanation([
        "This installs the tambo skill for AI agents.",
        "The skill helps AI coding assistants understand your Tambo setup.",
      ]);
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    if (!args.json) {
      out.success("Found valid package.json");
      out.subheader("SKILL INSTALLATION");
    }

    try {
      await installSkill({ prefix: args.prefix });
      result.skillInstalled = true;
      if (!args.json) {
        out.success("Tambo skill installed");
      }
    } catch (error) {
      const errorMessage = getSafeErrorMessage(error);
      if (!args.json) {
        out.error(`Failed to install skill: ${errorMessage}`);
      }
      result.errors.push(`Skill installation failed: ${errorMessage}`);
    }

    result.success = result.errors.length === 0;

    if (args.json) {
      out.json(result);
    } else {
      out.fileChanges({
        created: result.filesCreated,
        modified: result.filesModified,
        deleted: [],
      });

      out.summary({
        operation: "tambov1 init skill",
        success: result.success,
        details: {
          "skill installed": result.skillInstalled,
        },
        nextCommands: [
          { command: "tambov1 init config", description: "Create tambo.ts configuration" },
          { command: "tambov1 install message-thread-full", description: "Install a UI component" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});
