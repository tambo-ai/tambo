/**
 * Upgrade command - Upgrade packages, components, and skill
 *
 * Subcommands for granular control:
 * - packages: Upgrade npm packages only
 * - components: Upgrade installed Tambo components only
 * - skill: Install/upgrade tambo skill for AI agents
 *
 * Or run without subcommand to upgrade everything.
 */

import { defineCommand } from "citty";
import fs from "fs";
import ora from "ora";

import { upgradeNpmPackages } from "./upgrade/npm-packages.js";
import { upgradeSkill } from "./upgrade/skill.js";
import { upgradeComponents } from "./upgrade/components.js";

import { out } from "../utils/output.js";
import { requirePackageJson } from "../utils/project-helpers.js";
import { isTTY } from "../utils/tty.js";

// ============================================================================
// SHARED VALIDATION
// ============================================================================

function checkTamboDep(jsonMode: boolean): boolean {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  const hasTamboDep =
    packageJson.dependencies &&
    (packageJson.dependencies["@tambo-ai/react"] ??
      packageJson.dependencies.tambo);

  if (!hasTamboDep && !jsonMode) {
    out.warning("This doesn't appear to be a Tambo project (no @tambo-ai/react dependency).");
  }
  return hasTamboDep;
}

// ============================================================================
// UPGRADE PACKAGES
// ============================================================================

interface PackagesResult {
  success: boolean;
  errors: string[];
}

const packagesCommand = defineCommand({
  meta: {
    name: "packages",
    description: "Upgrade npm packages (@tambo-ai/react, etc.)",
  },
  args: {
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
    "legacy-peer-deps": {
      type: "boolean",
      description: "Use --legacy-peer-deps for npm install",
      default: false,
    },
  },
  async run({ args }) {
    const result: PackagesResult = {
      success: false,
      errors: [],
    };

    if (!args.json) {
      out.header("UPGRADE PACKAGES");
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    checkTamboDep(args.json);

    const spinner = args.json || !isTTY() ? null : ora("Upgrading npm packages...").start();

    try {
      const success = await upgradeNpmPackages({
        legacyPeerDeps: args["legacy-peer-deps"],
        yes: true,
        silent: args.json,
      });

      if (success) {
        spinner?.succeed("npm packages upgraded");
        result.success = true;
      } else {
        spinner?.fail("npm package upgrade failed");
        result.errors.push("npm package upgrade failed");
      }
    } catch (error) {
      spinner?.fail("npm package upgrade failed");
      result.errors.push(`${error}`);
    }

    if (args.json) {
      out.json(result);
    } else if (result.success) {
      out.summary({
        operation: "tambov1 upgrade packages",
        success: true,
        details: {},
        nextCommands: [
          { command: "tambov1 upgrade components", description: "Upgrade installed components" },
          { command: "npm run build", description: "Verify build works" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});

// ============================================================================
// UPGRADE COMPONENTS
// ============================================================================

interface ComponentsResult {
  success: boolean;
  errors: string[];
}

const componentsCommand = defineCommand({
  meta: {
    name: "components",
    description: "Upgrade installed Tambo components",
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
    },
    "legacy-peer-deps": {
      type: "boolean",
      description: "Use --legacy-peer-deps for npm install",
      default: false,
    },
  },
  async run({ args }) {
    const result: ComponentsResult = {
      success: false,
      errors: [],
    };

    if (!args.json) {
      out.header("UPGRADE COMPONENTS");
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    const spinner = args.json || !isTTY() ? null : ora("Upgrading Tambo components...").start();

    try {
      const success = await upgradeComponents({
        prefix: args.prefix,
        legacyPeerDeps: args["legacy-peer-deps"],
        yes: true,
        silent: args.json,
      });

      if (success) {
        spinner?.succeed("Components upgraded");
        result.success = true;
      } else {
        spinner?.fail("Component upgrade failed");
        result.errors.push("Component upgrade failed");
      }
    } catch (error) {
      spinner?.fail("Component upgrade failed");
      result.errors.push(`${error}`);
    }

    if (args.json) {
      out.json(result);
    } else if (result.success) {
      out.summary({
        operation: "tambov1 upgrade components",
        success: true,
        details: {},
        nextCommands: [
          { command: "tambov1 upgrade skill", description: "Install tambo skill" },
          { command: "npm run dev", description: "Test your app" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});

// ============================================================================
// UPGRADE SKILL
// ============================================================================

interface SkillResult {
  success: boolean;
  errors: string[];
  targetPath?: string;
  filesInstalled?: string[];
}

const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description: "Install/upgrade tambo skill for AI agents",
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
    },
  },
  async run({ args }) {
    const result: SkillResult = {
      success: false,
      errors: [],
    };

    if (!args.json) {
      out.header("INSTALL SKILL");
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    const spinner = args.json || !isTTY() ? null : ora("Installing tambo skill...").start();

    try {
      const upgradeResult = await upgradeSkill({
        prefix: args.prefix,
        yes: true,
        silent: args.json,
      });

      if (upgradeResult.success) {
        spinner?.succeed("Skill installed");
        result.success = true;
        result.targetPath = upgradeResult.result?.targetPath;
        result.filesInstalled = upgradeResult.result?.filesInstalled;
      } else {
        spinner?.fail("Skill installation failed");
        result.errors.push("Skill installation failed");
      }
    } catch (error) {
      spinner?.fail("Skill installation failed");
      result.errors.push(`${error}`);
    }

    if (args.json) {
      out.json(result);
    } else if (result.success) {
      const details: Record<string, string | number | boolean> = {};
      if (result.targetPath) {
        details["installed to"] = result.targetPath;
      }
      if (result.filesInstalled) {
        details["files installed"] = result.filesInstalled.length;
      }

      out.summary({
        operation: "tambov1 upgrade skill",
        success: true,
        details,
        nextCommands: [
          { command: "tambov1 upgrade packages", description: "Upgrade npm packages" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});

// ============================================================================
// UPGRADE ALL (default)
// ============================================================================

interface UpgradeAllResult {
  success: boolean;
  packagesUpgraded: boolean;
  componentsUpgraded: boolean;
  skillInstalled: boolean;
  errors: string[];
}

const allCommand = defineCommand({
  meta: {
    name: "all",
    description: "Upgrade everything (packages + components + skill)",
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
    },
    "legacy-peer-deps": {
      type: "boolean",
      description: "Use --legacy-peer-deps for npm install",
      default: false,
    },
    "skip-agent-docs": {
      type: "boolean",
      description: "Skip installing tambo skill",
      default: false,
    },
  },
  async run({ args }) {
    const result: UpgradeAllResult = {
      success: false,
      packagesUpgraded: false,
      componentsUpgraded: false,
      skillInstalled: false,
      errors: [],
    };

    if (!args.json) {
      out.header("UPGRADE ALL");
      out.explanation([
        "This will upgrade:",
        "• npm packages (@tambo-ai/react, etc.)",
        "• Installed Tambo components",
        args["skip-agent-docs"] ? "• Tambo skill (skipped)" : "• Tambo skill for AI agents",
      ]);
    }

    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    checkTamboDep(args.json);

    // 1. Packages
    if (!args.json) out.subheader("1. NPM PACKAGES");
    const pkgSpinner = args.json || !isTTY() ? null : ora("Upgrading npm packages...").start();

    try {
      const pkgSuccess = await upgradeNpmPackages({
        legacyPeerDeps: args["legacy-peer-deps"],
        yes: true,
        silent: args.json,
      });
      if (pkgSuccess) {
        pkgSpinner?.succeed("npm packages upgraded");
        result.packagesUpgraded = true;
      } else {
        pkgSpinner?.fail("npm packages failed");
        result.errors.push("npm packages failed");
      }
    } catch (error) {
      pkgSpinner?.fail("npm packages failed");
      result.errors.push(`npm packages: ${error}`);
    }

    // 2. Skill
    if (!args["skip-agent-docs"]) {
      if (!args.json) out.subheader("2. SKILL");
      const skillSpinner = args.json || !isTTY() ? null : ora("Installing tambo skill...").start();

      try {
        const skillResult = await upgradeSkill({
          prefix: args.prefix,
          yes: true,
          silent: args.json,
        });
        if (skillResult.success) {
          skillSpinner?.succeed("Skill installed");
          result.skillInstalled = true;
        } else {
          skillSpinner?.fail("Skill installation failed");
          result.errors.push("Skill installation failed");
        }
      } catch (error) {
        skillSpinner?.fail("Skill installation failed");
        result.errors.push(`Skill: ${error}`);
      }
    }

    // 3. Components
    if (!args.json) out.subheader("3. COMPONENTS");
    const compSpinner = args.json || !isTTY() ? null : ora("Upgrading components...").start();

    try {
      const compSuccess = await upgradeComponents({
        prefix: args.prefix,
        legacyPeerDeps: args["legacy-peer-deps"],
        yes: true,
        silent: args.json,
      });
      if (compSuccess) {
        compSpinner?.succeed("Components upgraded");
        result.componentsUpgraded = true;
      } else {
        compSpinner?.fail("Components failed");
        result.errors.push("Components failed");
      }
    } catch (error) {
      compSpinner?.fail("Components failed");
      result.errors.push(`Components: ${error}`);
    }

    result.success = result.errors.length === 0;

    if (args.json) {
      out.json(result);
    } else {
      out.summary({
        operation: "tambov1 upgrade all",
        success: result.success,
        details: {
          "packages upgraded": result.packagesUpgraded,
          "components upgraded": result.componentsUpgraded,
          "skill installed": result.skillInstalled,
        },
        nextCommands: [
          { command: "npm run build", description: "Verify build works" },
          { command: "npm run dev", description: "Test your app" },
        ],
      });
    }

    if (!result.success) process.exit(1);
  },
});

// ============================================================================
// MAIN UPGRADE COMMAND
// ============================================================================

export const upgrade = defineCommand({
  meta: {
    name: "upgrade",
    description: "Upgrade packages, components, and skill",
  },
  subCommands: {
    packages: packagesCommand,
    components: componentsCommand,
    skill: skillCommand,
    all: allCommand,
  },
});
