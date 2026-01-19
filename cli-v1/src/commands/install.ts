/**
 * Install command - Add components to your project
 *
 * Non-interactive component installation that:
 * - Auto-resolves all dependencies
 * - Uses src/components directory by default
 * - Installs all npm dependencies automatically
 * - Provides verbose output with next steps
 */

import { defineCommand } from "citty";
import fs from "fs";
import path from "path";
import chalk from "chalk";

import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../constants/paths.js";
import { resolveComponentDependencies } from "../utils/dependency-resolution.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
  resolveComponentPaths,
} from "../utils/path-utils.js";
import { installComponents } from "./add/component.js";
import { setupTailwindAndGlobals } from "./add/tailwind-setup.js";
import { getKnownComponentNames, getComponentList } from "./add/utils.js";

import { getSafeErrorMessage } from "../utils/error-helpers.js";
import { out } from "../utils/output.js";
import { requirePackageJson } from "../utils/project-helpers.js";
import { isTTY } from "../utils/tty.js";

interface InstallResult {
  success: boolean;
  dryRun: boolean;
  componentsRequested: string[];
  componentsInstalled: string[];
  componentsSkipped: string[];
  dependenciesResolved: string[];
  wouldInstall?: string[];
  errors: string[];
  filesCreated: string[];
  filesModified: string[];
}

export const install = defineCommand({
  meta: {
    name: "install",
    description: "Install components into your project",
  },
  args: {
    components: {
      type: "positional",
      description: "Components to install",
      required: true,
    },
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
    "dry-run": {
      type: "boolean",
      description: "Preview what would be installed without making changes",
      default: false,
    },
    "skip-tailwind": {
      type: "boolean",
      description: "Skip Tailwind CSS configuration",
      default: false,
    },
  },
  async run({ args }) {
    const componentNames = Array.isArray(args.components)
      ? args.components
      : [args.components];

    const result: InstallResult = {
      success: false,
      dryRun: args["dry-run"],
      componentsRequested: componentNames,
      componentsInstalled: [],
      componentsSkipped: [],
      dependenciesResolved: [],
      errors: [],
      filesCreated: [],
      filesModified: [],
    };

    if (!args.json) {
      out.header(args["dry-run"] ? "INSTALL COMPONENTS (DRY RUN)" : "INSTALL COMPONENTS");
      out.keyValue("Requested components", componentNames.join(", "));
      if (args["dry-run"]) {
        out.info("Dry run mode - no changes will be made");
      }
    }

    // Validate project
    const projectRoot = process.cwd();
    if (!requirePackageJson(args, result)) {
      process.exit(1);
    }

    // Validate component names
    const availableComponents = getComponentList();
    const availableNames = new Set(availableComponents.map((c) => c.name));
    const invalidComponents = componentNames.filter((c) => !availableNames.has(c));

    if (invalidComponents.length > 0) {
      if (!args.json) {
        out.error(`Invalid component(s): ${invalidComponents.join(", ")}`);
        out.subheader("AVAILABLE COMPONENTS");
        printAvailableComponents();
      }
      result.errors.push(`Invalid components: ${invalidComponents.join(", ")}`);
      if (args.json) {
        out.json(result);
      }
      process.exit(1);
    }

    // Determine installation path
    let installPath = args.prefix;
    let isExplicitPrefix = args.prefix !== "src/components";
    let baseInstallPath: string | undefined;

    if (!args.json) {
      out.subheader("INSTALLATION PATH DETECTION");
    }

    // Check for legacy components
    if (!isExplicitPrefix) {
      const legacyPath = getLegacyComponentDirectoryPath(projectRoot, installPath);
      const newPath = getComponentDirectoryPath(projectRoot, installPath, false);
      const knownTamboComponents = getKnownComponentNames();

      const hasTamboComponentsInLegacy =
        fs.existsSync(legacyPath) &&
        fs
          .readdirSync(legacyPath)
          .filter((f) => f.endsWith(".tsx"))
          .map((f) => f.replace(".tsx", ""))
          .some((name) => knownTamboComponents.has(name));

      const hasNewComponents =
        fs.existsSync(newPath) &&
        fs.readdirSync(newPath).some((f) => f.endsWith(".tsx"));

      if (hasTamboComponentsInLegacy && !hasNewComponents) {
        out.warning(
          `Found existing components in ${LEGACY_COMPONENT_SUBDIR}/. Using same location for compatibility.`
        );
        out.explanation([
          `Components will be installed to ${LEGACY_COMPONENT_SUBDIR}/ to match existing setup.`,
          `Run 'tambov1 migrate' to move all components to ${COMPONENT_SUBDIR}/.`,
        ]);
        baseInstallPath = installPath;
        installPath = path.join(installPath, LEGACY_COMPONENT_SUBDIR);
        isExplicitPrefix = true;
      } else if (hasTamboComponentsInLegacy && hasNewComponents) {
        out.warning(
          `Found components in both ${LEGACY_COMPONENT_SUBDIR}/ and ${COMPONENT_SUBDIR}/ locations.`
        );
        out.explanation([
          "This can cause import path issues between components.",
          "Consider consolidating with: tambov1 migrate",
        ]);
      }
    }

    const finalPath = getComponentDirectoryPath(projectRoot, installPath, isExplicitPrefix);
    if (!args.json) {
      out.keyValue("Installation directory", finalPath);
    }

    // Resolve dependencies
    if (!args.json) {
      out.subheader("DEPENDENCY RESOLUTION");
      out.info("Resolving component dependencies...");
    }

    const allComponents = new Set<string>();
    for (const componentName of componentNames) {
      try {
        const deps = await resolveComponentDependencies(componentName);
        deps.forEach((dep) => allComponents.add(dep));
      } catch (error) {
        const safeMessage = getSafeErrorMessage(error);
        if (!args.json) {
          out.error(`Failed to resolve dependencies for ${componentName}: ${safeMessage}`);
        }
        result.errors.push(`Dependency resolution failed: ${safeMessage}`);
        // Abort early - can't continue install with incomplete dependencies
        if (args.json) {
          out.json(result);
        }
        process.exit(1);
      }
    }

    const components = Array.from(allComponents);
    result.dependenciesResolved = components;

    if (!args.json) {
      out.success(`Resolved ${components.length} component(s) including dependencies`);
      components.forEach((comp) => {
        const isRequested = componentNames.includes(comp);
        console.log(
          `  ${isRequested ? chalk.green("•") : chalk.dim("•")} ${comp}${isRequested ? "" : chalk.dim(" (dependency)")}`
        );
      });
    }

    // Check which components need installation
    const existingComponents: string[] = [];
    const newComponents: string[] = [];

    for (const comp of components) {
      const { newPath, legacyPath } = resolveComponentPaths(
        projectRoot,
        installPath,
        comp,
        isExplicitPrefix
      );

      if (fs.existsSync(newPath) || (legacyPath && fs.existsSync(legacyPath))) {
        existingComponents.push(comp);
      } else {
        newComponents.push(comp);
      }
    }

    result.componentsSkipped = existingComponents;

    if (!args.json) {
      out.subheader("INSTALLATION PLAN");
    }

    if (newComponents.length === 0) {
      if (!args.json) {
        out.info("All components are already installed");
      }
      if (!args.json) {
        out.explanation([
          "No new components to install.",
          "Use 'tambov1 update' to update existing components.",
        ]);
      }
      result.success = true;
      result.componentsInstalled = [];

      if (args.json) {
        out.json(result);
      } else {
        out.summary({
          operation: "tambov1 install",
          success: true,
          details: {
            requested: componentNames.join(", "),
            installed: 0,
            skipped: existingComponents.length,
          },
          nextCommands: [
            {
              command: "tambov1 update installed",
              description: "Update all installed components",
            },
          ],
        });
      }
      return;
    }

    if (!args.json) {
      out.info(`Components to install: ${newComponents.length}`);
      newComponents.forEach((comp) => console.log(`  ${chalk.green("+")} ${comp}`));

      if (existingComponents.length > 0) {
        out.info(`Already installed: ${existingComponents.length}`);
        existingComponents.forEach((comp) => console.log(`  ${chalk.dim("✓")} ${comp}`));
      }
    }

    // Handle dry-run: exit here with preview
    if (args["dry-run"]) {
      result.success = true;
      result.wouldInstall = newComponents;

      if (args.json) {
        out.json(result);
      } else {
        out.subheader("DRY RUN COMPLETE");
        out.success("No changes made.");
        out.summary({
          operation: "tambov1 install --dry-run",
          success: true,
          details: {
            "would install": newComponents.length,
            "already installed": existingComponents.length,
            components: newComponents.join(", "),
          },
          nextCommands: [
            {
              command: `tambov1 install ${componentNames.join(" ")}`,
              description: "Run install for real",
            },
          ],
        });
      }
      return;
    }

    // Install components
    if (!args.json) {
      out.subheader("INSTALLING COMPONENTS");
    }

    try {
      await installComponents(newComponents, {
        legacyPeerDeps: args["legacy-peer-deps"],
        installPath,
        isExplicitPrefix,
        baseInstallPath,
        silent: args.json,
        yes: true,
      });

      result.componentsInstalled = newComponents;
      newComponents.forEach((comp) => {
        const compPath = path.join(finalPath, `${comp}.tsx`);
        result.filesCreated.push(compPath);
      });

      if (!args.json) {
        out.success(`Installed ${newComponents.length} component(s)`);
      }
    } catch (error) {
      const safeMessage = getSafeErrorMessage(error);
      if (!args.json) {
        out.error(`Installation failed: ${safeMessage}`);
      }
      result.errors.push(`Installation failed: ${safeMessage}`);
      if (args.json) {
        out.json(result);
      }
      process.exit(1);
    }

    // Setup Tailwind
    if (!args["skip-tailwind"]) {
      if (!args.json) {
        out.subheader("TAILWIND CONFIGURATION");
        out.info("Setting up Tailwind CSS...");
      }

      try {
        await setupTailwindAndGlobals(projectRoot);
        if (!args.json) {
          out.success("Tailwind CSS configured");
        }
      } catch (error) {
        const safeMessage = getSafeErrorMessage(error);
        if (!args.json) {
          out.warning(`Tailwind setup warning: ${safeMessage}`);
        }
        result.errors.push(`Tailwind setup: ${safeMessage}`);
      }
    } else {
      if (!args.json) {
        out.subheader("TAILWIND CONFIGURATION");
        out.info("Skipping Tailwind setup (--skip-tailwind)");
      }
    }

    result.success = true;

    if (args.json) {
      out.json(result);
    } else {
      out.fileChanges({
        created: result.filesCreated,
        modified: result.filesModified,
        deleted: [],
      });

      out.summary({
        operation: "tambov1 install",
        success: true,
        details: {
          requested: componentNames.join(", "),
          installed: newComponents.length,
          skipped: existingComponents.length,
          "install path": finalPath,
        },
        nextCommands: [
          {
            command: "tambov1 list",
            description: "View all installed components",
          },
          {
            command: "npm run dev",
            description: "Start your development server",
          },
        ],
      });

      if (isTTY()) {
        out.info("See component demos at https://ui.tambo.co");
      }

      out.subheader("USAGE INSTRUCTIONS");
      out.explanation([
        "Import the installed components in your React code:",
        "",
        `  import { ComponentName } from "@/components/${COMPONENT_SUBDIR}/component-name";`,
        "",
        "Wrap your app with TamboProvider:",
        "",
        '  import { TamboProvider } from "@tambo-ai/react";',
        '  import { components } from "@/lib/tambo";',
        "",
        "See documentation at https://docs.tambo.co for detailed usage.",
      ]);
    }
  },
});

function printAvailableComponents(): void {
  const components = getComponentList();
  components.sort((a, b) => a.name.localeCompare(b.name));

  console.log(chalk.dim("  These components can be installed with: tambov1 install <name>"));
  console.log();

  components.forEach((component) => {
    console.log(
      `  ${chalk.bold.cyan(component.name.padEnd(30))} ${chalk.dim(component.description)}`
    );
  });

  console.log();
}
