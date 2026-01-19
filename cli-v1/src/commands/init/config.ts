/**
 * Init config subcommand - Create tambo.ts configuration file
 */

import { defineCommand } from "citty";
import fs from "fs";
import path from "path";

import { tamboTsTemplate } from "../../templates/tambo-ts.js";
import { getSafeErrorMessage } from "../../utils/error-helpers.js";
import { out } from "../../utils/output.js";
import { getLibDirectory } from "../../utils/path-utils.js";
import { requirePackageJson } from "../../utils/project-helpers.js";
import { checkApiKey } from "./helpers.js";
import type { ConfigResult } from "./types.js";

export const configCommand = defineCommand({
  meta: {
    name: "config",
    description: "Create tambo.ts configuration file",
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
    force: {
      type: "boolean",
      description: "Overwrite existing tambo.ts file",
      default: false,
    },
  },
  async run({ args }) {
    const result: ConfigResult = {
      success: false,
      tamboTsCreated: false,
      apiKeyFound: false,
      errors: [],
      warnings: [],
      filesCreated: [],
      filesModified: [],
    };

    if (!args.json) {
      out.header("INITIALIZE TAMBO CONFIG");
      out.explanation([
        "This creates the tambo.ts configuration file.",
        `Location: ${args.prefix}/lib/tambo.ts`,
      ]);
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    if (!args.json) {
      out.success("Found valid package.json");
      out.subheader("API KEY CHECK");
    }

    const apiKeyCheck = checkApiKey(args.json);
    result.apiKeyFound = apiKeyCheck.found;
    if (!apiKeyCheck.found) {
      result.warnings.push("No API key found in .env files");
    }

    if (!args.json) {
      out.subheader("TAMBO CONFIGURATION");
    }

    const projectRoot = process.cwd();
    const isExplicitPrefix = args.prefix !== "src/components";

    try {
      const libDir = getLibDirectory(projectRoot, args.prefix, isExplicitPrefix);
      fs.mkdirSync(libDir, { recursive: true });
      const tamboTsPath = path.join(libDir, "tambo.ts");
      result.tamboTsPath = tamboTsPath;

      if (fs.existsSync(tamboTsPath) && !args.force) {
        if (!args.json) {
          out.info("tambo.ts already exists (use --force to overwrite)");
        }
        result.warnings.push("tambo.ts already exists");
      } else {
        fs.writeFileSync(tamboTsPath, tamboTsTemplate);
        result.tamboTsCreated = true;
        result.filesCreated.push(tamboTsPath);
        if (!args.json) {
          out.success(`Created tambo.ts at ${tamboTsPath}`);
          out.explanation([
            "This file defines your Tambo component and tool registry.",
            "Add your custom components and tools here.",
          ]);
        }
      }
    } catch (error) {
      const errorMessage = getSafeErrorMessage(error);
      result.errors.push(`Failed to create tambo.ts: ${errorMessage}`);
      if (!args.json) {
        out.error(`Failed to create tambo.ts: ${errorMessage}`);
      }
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
        operation: "tambov1 init config",
        success: result.success,
        details: {
          "API key found": result.apiKeyFound,
          "tambo.ts created": result.tamboTsCreated,
          warnings: result.warnings.length > 0 ? result.warnings.join("; ") : "none",
        },
        nextCommands: [
          { command: "tambov1 init skill", description: "Install tambo skill" },
          { command: "tambov1 install message-thread-full", description: "Install a UI component" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});
