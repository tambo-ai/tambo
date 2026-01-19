/**
 * Components command - Manage and inspect Tambo components
 *
 * Subcommands:
 * - installed: List installed components
 * - available: List components available from registry
 * - deps: Show dependencies for a component
 */

import { defineCommand } from "citty";
import fs from "fs";
import path from "path";
import chalk from "chalk";

import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../constants/paths.js";
import { getKnownComponentNames, getComponentList } from "./add/utils.js";
import { resolveComponentDependencies } from "../utils/dependency-resolution.js";

import { out } from "../utils/output.js";

// ============================================================================
// INSTALLED
// ============================================================================

interface InstalledResult {
  success: boolean;
  tamboComponents: {
    name: string;
    path: string;
    location: "new" | "legacy";
  }[];
  customComponents: {
    name: string;
    path: string;
  }[];
  errors: string[];
}

const installedCommand = defineCommand({
  meta: {
    name: "installed",
    description: "List installed Tambo components",
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
    const result: InstalledResult = {
      success: false,
      tamboComponents: [],
      customComponents: [],
      errors: [],
    };

    if (!args.json) {
      out.header("INSTALLED COMPONENTS");
    }

    const projectRoot = process.cwd();
    const prefix = args.prefix;
    const knownTamboComponents = getKnownComponentNames();

    const newPath = path.join(projectRoot, prefix, COMPONENT_SUBDIR);
    const legacyPath = path.join(projectRoot, prefix, LEGACY_COMPONENT_SUBDIR);

    // Scan new location
    if (fs.existsSync(newPath)) {
      const files = fs.readdirSync(newPath).filter((f) => f.endsWith(".tsx"));
      for (const file of files) {
        const name = file.replace(".tsx", "");
        const fullPath = path.join(newPath, file);
        if (knownTamboComponents.has(name)) {
          result.tamboComponents.push({ name, path: fullPath, location: "new" });
        } else {
          result.customComponents.push({ name, path: fullPath });
        }
      }
    }

    // Scan legacy location
    if (fs.existsSync(legacyPath)) {
      const files = fs.readdirSync(legacyPath).filter((f) => f.endsWith(".tsx"));
      for (const file of files) {
        const name = file.replace(".tsx", "");
        const fullPath = path.join(legacyPath, file);
        const alreadyFound = result.tamboComponents.some((c) => c.name === name);
        if (!alreadyFound) {
          if (knownTamboComponents.has(name)) {
            result.tamboComponents.push({ name, path: fullPath, location: "legacy" });
          } else {
            const customAlreadyFound = result.customComponents.some((c) => c.name === name);
            if (!customAlreadyFound) {
              result.customComponents.push({ name, path: fullPath });
            }
          }
        }
      }
    }

    result.success = true;

    if (args.json) {
      out.json(result);
      return;
    }

    // Print Tambo components
    if (result.tamboComponents.length > 0) {
      out.subheader(`TAMBO COMPONENTS (${result.tamboComponents.length})`);
      result.tamboComponents
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((comp) => {
          const locationBadge = comp.location === "legacy"
            ? chalk.yellow(" [legacy]")
            : chalk.green(" [tambo/]");
          console.log(`  ${chalk.cyan("•")} ${chalk.bold(comp.name)}${locationBadge}`);
          if (args.prefix !== "src/components") {
            console.log(chalk.dim(`    ${comp.path}`));
          }
        });
    } else {
      out.info("No Tambo components installed.");
    }

    // Print custom components
    if (result.customComponents.length > 0) {
      out.subheader(`CUSTOM COMPONENTS (${result.customComponents.length})`);
      result.customComponents
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((comp) => {
          console.log(`  ${chalk.magenta("•")} ${chalk.bold(comp.name)}`);
        });
    }

    // Check for legacy components
    const legacyComponents = result.tamboComponents.filter((c) => c.location === "legacy");
    if (legacyComponents.length > 0) {
      out.warning(`${legacyComponents.length} component(s) in legacy ui/ location. Run 'tambov1 migrate' to fix.`);
    }

    out.nextCommands([
      { command: "tambov1 components available", description: "See components you can install" },
      { command: "tambov1 update --all", description: "Update all installed components" },
    ]);
  },
});

// ============================================================================
// AVAILABLE
// ============================================================================

interface AvailableResult {
  success: boolean;
  components: {
    name: string;
    description: string;
    installed: boolean;
  }[];
  errors: string[];
}

const availableCommand = defineCommand({
  meta: {
    name: "available",
    description: "List components available from registry",
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
    const result: AvailableResult = {
      success: false,
      components: [],
      errors: [],
    };

    if (!args.json) {
      out.header("AVAILABLE COMPONENTS");
    }

    // Get all available components
    const allComponents = getComponentList();

    // Get installed components to mark them
    const projectRoot = process.cwd();
    const newPath = path.join(projectRoot, args.prefix, COMPONENT_SUBDIR);
    const legacyPath = path.join(projectRoot, args.prefix, LEGACY_COMPONENT_SUBDIR);

    const installedNames = new Set<string>();

    if (fs.existsSync(newPath)) {
      fs.readdirSync(newPath)
        .filter((f) => f.endsWith(".tsx"))
        .forEach((f) => installedNames.add(f.replace(".tsx", "")));
    }
    if (fs.existsSync(legacyPath)) {
      fs.readdirSync(legacyPath)
        .filter((f) => f.endsWith(".tsx"))
        .forEach((f) => installedNames.add(f.replace(".tsx", "")));
    }

    result.components = allComponents
      .map((c) => ({
        name: c.name,
        description: c.description,
        installed: installedNames.has(c.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    result.success = true;

    if (args.json) {
      out.json(result);
      return;
    }

    const notInstalled = result.components.filter((c) => !c.installed);
    const installed = result.components.filter((c) => c.installed);

    out.subheader(`NOT INSTALLED (${notInstalled.length})`);
    if (notInstalled.length > 0) {
      notInstalled.forEach((comp) => {
        console.log(`  ${chalk.green("+")} ${chalk.bold(comp.name.padEnd(30))} ${chalk.dim(comp.description)}`);
      });
    } else {
      out.info("All components are installed!");
    }

    if (installed.length > 0) {
      out.subheader(`ALREADY INSTALLED (${installed.length})`);
      installed.forEach((comp) => {
        console.log(`  ${chalk.dim("✓")} ${chalk.dim(comp.name.padEnd(30))} ${chalk.dim(comp.description)}`);
      });
    }

    if (notInstalled.length > 0) {
      out.nextCommands([
        { command: `tambov1 install ${notInstalled[0].name}`, description: "Install a component" },
        { command: `tambov1 components deps ${notInstalled[0].name}`, description: "Check dependencies first" },
      ]);
    }
  },
});

// ============================================================================
// DEPS
// ============================================================================

interface DepsResult {
  success: boolean;
  component: string;
  dependencies: string[];
  errors: string[];
}

const depsCommand = defineCommand({
  meta: {
    name: "deps",
    description: "Show dependencies for a component",
  },
  args: {
    component: {
      type: "positional",
      description: "Component name to check dependencies for",
      required: true,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      default: false,
    },
  },
  async run({ args }) {
    const result: DepsResult = {
      success: false,
      component: args.component,
      dependencies: [],
      errors: [],
    };

    if (!args.json) {
      out.header("COMPONENT DEPENDENCIES");
      out.keyValue("Component", args.component);
    }

    // Validate component exists in registry
    const allComponents = getComponentList();
    const exists = allComponents.some((c) => c.name === args.component);

    if (!exists) {
      if (!args.json) {
        out.error(`Component "${args.component}" not found in registry.`);
        out.nextCommands([
          { command: "tambov1 components available", description: "List available components" },
        ]);
      }
      result.errors.push(`Component "${args.component}" not found`);
      if (args.json) out.json(result);
      process.exit(1);
    }

    try {
      const deps = await resolveComponentDependencies(args.component);
      result.dependencies = deps;
      result.success = true;

      if (args.json) {
        out.json(result);
        return;
      }

      if (deps.length === 1) {
        out.info("No dependencies - this component is standalone.");
      } else {
        out.subheader(`WILL INSTALL (${deps.length} components)`);
        deps.forEach((dep, i) => {
          const isTarget = dep === args.component;
          const marker = isTarget ? chalk.cyan("→") : chalk.dim("•");
          const label = isTarget ? chalk.bold(dep) : chalk.dim(dep + " (dependency)");
          console.log(`  ${i + 1}. ${marker} ${label}`);
        });
      }

      out.nextCommands([
        { command: `tambov1 install ${args.component}`, description: "Install this component and its dependencies" },
        { command: `tambov1 install ${args.component} --dry-run`, description: "Preview installation" },
      ]);
    } catch (error) {
      if (!args.json) {
        out.error(`Failed to resolve dependencies: ${error}`);
      }
      result.errors.push(`${error}`);
      if (args.json) out.json(result);
      process.exit(1);
    }
  },
});

// ============================================================================
// MAIN COMPONENTS COMMAND
// ============================================================================

export const components = defineCommand({
  meta: {
    name: "components",
    description: "Manage and inspect Tambo components",
  },
  subCommands: {
    installed: installedCommand,
    available: availableCommand,
    deps: depsCommand,
  },
});

// DEPRECATED: list is an alias for 'components installed'
// This will be removed in a future version
export const list = defineCommand({
  meta: {
    name: "list",
    description: "[DEPRECATED] Use 'tambov1 components installed' instead",
  },
  args: installedCommand.args,
  async run(context) {
    // Show deprecation warning (unless in JSON mode)
    if (!context.args.json) {
      console.log(
        chalk.yellow("⚠️  DEPRECATED:") +
          " 'list' is deprecated. Please use 'tambov1 components installed' instead.\n"
      );
    }

    // Delegate to installed command
    return installedCommand.run?.(context);
  },
});
