/**
 * Update command - Update installed Tambo components
 *
 * Usage:
 * - tambov1 update --all          Update all installed components
 * - tambov1 update foo bar        Update specific components
 */

import { defineCommand } from "citty";
import ora from "ora";

import { handleUpdateComponents } from "./update-core.js";
import { getInstalledComponents } from "./add/utils.js";

import { out } from "../utils/output.js";
import { requirePackageJson } from "../utils/project-helpers.js";
import { isTTY } from "../utils/tty.js";

interface UpdateResult {
  success: boolean;
  mode: "all" | "specific";
  componentsUpdated: string[];
  errors: string[];
}

export const update = defineCommand({
  meta: {
    name: "update",
    description: "Update installed Tambo components",
  },
  args: {
    components: {
      type: "positional",
      description: "Specific components to update (omit for --all)",
      required: false,
    },
    all: {
      type: "boolean",
      description: "Update all installed components",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
    prefix: {
      type: "string",
      description: "Custom directory prefix for components",
    },
    "legacy-peer-deps": {
      type: "boolean",
      description: "Use --legacy-peer-deps for npm install",
      default: false,
    },
  },
  async run({ args }) {
    const result: UpdateResult = {
      success: false,
      mode: args.all ? "all" : "specific",
      componentsUpdated: [],
      errors: [],
    };

    // Determine what to update
    let componentNames: string[];

    if (args.all) {
      componentNames = ["installed"];
      result.mode = "all";
    } else if (args.components) {
      componentNames = Array.isArray(args.components)
        ? args.components
        : [args.components];
      result.mode = "specific";
    } else {
      // No args provided - show help
      if (!args.json) {
        out.header("UPDATE COMPONENTS");
        out.error("No components specified.");
        out.explanation([
          "Usage:",
          "  tambov1 update --all           Update all installed components",
          "  tambov1 update foo bar         Update specific components",
        ]);
        out.nextCommands([
          {
            command: "tambov1 update --all",
            description: "Update all installed components",
          },
          {
            command: "tambov1 components installed",
            description: "List installed components first",
          },
        ]);
      } else {
        result.errors.push(
          "No components specified. Use --all or provide component names.",
        );
        out.json(result);
      }
      process.exit(1);
    }

    if (!args.json) {
      out.header("UPDATE COMPONENTS");
      out.keyValue("Mode", args.all ? "ALL INSTALLED" : "SPECIFIC");
      if (!args.all) {
        out.keyValue("Components", componentNames.join(", "));
      }
    }

    // Validate project
    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    // For --all mode, get the actual list of installed components before updating
    // so we can report exactly which components were updated in JSON output
    let actualComponentNames: string[] = componentNames;
    if (args.all) {
      const installPath = args.prefix ?? "src/components";
      const isExplicitPrefix = !!args.prefix;
      actualComponentNames = await getInstalledComponents(
        installPath,
        isExplicitPrefix,
      );
    }

    const spinner =
      args.json || !isTTY() ? null : ora("Updating components...").start();

    try {
      await handleUpdateComponents(componentNames, {
        legacyPeerDeps: args["legacy-peer-deps"],
        prefix: args.prefix,
        yes: true,
      });

      spinner?.succeed("Components updated");
      result.success = true;
      // Use the actual component names instead of ["installed"] for accurate JSON output
      result.componentsUpdated = actualComponentNames;

      if (args.json) {
        out.json(result);
      } else {
        out.summary({
          operation: "tambov1 update",
          success: true,
          details: {
            mode: args.all ? "all installed" : "specific",
            components: args.all
              ? actualComponentNames.join(", ")
              : componentNames.join(", "),
          },
          nextCommands: [
            {
              command: "tambov1 components installed",
              description: "View installed components",
            },
            { command: "npm run dev", description: "Test your app" },
            { command: "npm run build", description: "Verify build works" },
          ],
        });

        if (isTTY()) {
          out.info("See component demos at https://ui.tambo.co");
        }
      }
    } catch (error) {
      spinner?.fail("Update failed");
      result.errors.push(`${error}`);

      if (args.json) {
        out.json(result);
      } else {
        out.error(`Update failed: ${error}`);
        out.nextCommands([
          {
            command: "tambov1 update --all --legacy-peer-deps",
            description: "Retry with legacy peer deps",
          },
          {
            command: "tambov1 components installed",
            description: "Check installed components",
          },
        ]);
      }
      process.exit(1);
    }
  },
});
