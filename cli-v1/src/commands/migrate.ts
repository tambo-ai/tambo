/**
 * Migrate command - Migrate components from ui/ to tambo/
 *
 * Non-interactive migration that:
 * - Auto-confirms migration
 * - Supports dry-run mode
 * - Provides verbose output with next steps
 */

import { defineCommand } from "citty";

import { handleMigrate } from "./migrate-core.js";

import { out } from "../utils/output.js";
import { requirePackageJson } from "../utils/project-helpers.js";

interface MigrateResult {
  success: boolean;
  componentsMigrated: string[];
  dryRun: boolean;
  errors: string[];
}

export const migrate = defineCommand({
  meta: {
    name: "migrate",
    description: "Migrate components from ui/ to tambo/ directory",
  },
  args: {
    "dry-run": {
      type: "boolean",
      description: "Preview changes without applying them",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: MigrateResult = {
      success: false,
      componentsMigrated: [],
      dryRun: args["dry-run"],
      errors: [],
    };

    if (!args.json) {
      out.header("MIGRATE COMPONENTS");
      if (args["dry-run"]) {
        out.warning("DRY RUN MODE - No changes will be made");
      }
      out.explanation([
        "This will move components from the legacy ui/ directory",
        "to the new tambo/ directory structure.",
      ]);
    }

    // Validate project
    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    if (!args.json) {
      out.subheader("RUNNING MIGRATION");
      out.info("Scanning for components to migrate...");
    }

    try {
      await handleMigrate({
        dryRun: args["dry-run"],
        yes: true,
      });

      result.success = true;

      if (!args.json) {
        out.success("Migration process completed");

        out.summary({
          operation: "tambov1 migrate",
          success: true,
          details: {
            "dry run": args["dry-run"],
          },
          nextCommands: args["dry-run"]
            ? [
                {
                  command: "tambov1 migrate",
                  description: "Run migration for real",
                },
              ]
            : [
                {
                  command: "tambov1 list",
                  description: "View all installed components",
                },
                {
                  command: "npm run dev",
                  description: "Start your development server to test",
                },
              ],
        });
      } else {
        out.json(result);
      }
    } catch (error) {
      result.errors.push(String(error));

      if (!args.json) {
        out.error(`Migration failed: ${error}`);
        out.nextCommands([
          {
            command: "tambov1 migrate --dry-run",
            description: "Preview what would be migrated",
          },
          {
            command: "tambov1 list",
            description: "Check current component locations",
          },
        ]);
      } else {
        out.json(result);
      }
      process.exit(1);
    }
  },
});
