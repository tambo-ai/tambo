import chalk from "chalk";
import fs from "fs";
import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import { getConfigPath } from "../add/utils.js";
import {
  confirmAction,
  migrateComponentsDuringUpgrade,
} from "../upgrade/utils.js";

/**
 * Location information for a component
 */
export interface ComponentLocation {
  /** Path to the component file */
  componentPath: string;
  /** Installation path */
  installPath: string;
  /** Whether the component needs to be created (found in legacy location) */
  needsCreation?: boolean;
}

/**
 * Represents a dependency inconsistency between components in different locations
 */
export interface DependencyInconsistency {
  /** Main component name */
  main: string;
  /** Location of the main component */
  mainLocation: "ui" | "tambo";
  /** Dependency component name */
  dependency: string;
  /** Location of the dependency component */
  depLocation: "ui" | "tambo";
}

/**
 * Finds the location of a component in the project
 * @param componentName - Name of the component to find
 * @param projectRoot - Project root directory
 * @param installPath - Pre-determined installation path
 * @param isExplicitPrefix - Whether the prefix is explicitly provided
 * @returns Component location information or null if not found
 */
export function findComponentLocation(
  componentName: string,
  projectRoot: string,
  installPath: string,
  isExplicitPrefix = false,
): ComponentLocation | null {
  try {
    // For explicit prefix, check the exact path provided
    if (isExplicitPrefix) {
      const componentPath = path.join(
        projectRoot,
        installPath,
        `${componentName}.tsx`,
      );
      return fs.existsSync(componentPath)
        ? { componentPath, installPath }
        : null;
    }

    // Check new location first (tambo/)
    const newComponentDir = path.join(
      projectRoot,
      installPath,
      COMPONENT_SUBDIR,
    );
    const newComponentPath = path.join(newComponentDir, `${componentName}.tsx`);

    if (fs.existsSync(newComponentPath)) {
      return {
        componentPath: newComponentPath,
        installPath,
      };
    }

    // Check legacy location (ui/)
    const legacyComponentDir = path.join(
      projectRoot,
      installPath,
      LEGACY_COMPONENT_SUBDIR,
    );
    const legacyComponentPath = path.join(
      legacyComponentDir,
      `${componentName}.tsx`,
    );

    if (fs.existsSync(legacyComponentPath)) {
      return {
        componentPath: newComponentPath, // Return new path for upgrade destination
        installPath,
        needsCreation: true,
      };
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to locate component ${componentName}: ${error}`);
  }
}

/**
 * Detects cross-location dependencies between components
 * @param verifiedComponents - List of verified components
 * @param installPath - Base installation path
 * @param isExplicitPrefix - Whether the prefix is explicitly provided
 * @returns Array of dependency inconsistencies found
 */
export async function detectCrossLocationDependencies(
  verifiedComponents: { name: string; installPath: string }[],
  installPath: string,
  isExplicitPrefix: boolean,
): Promise<DependencyInconsistency[]> {
  const inconsistencies: DependencyInconsistency[] = [];

  for (const component of verifiedComponents) {
    try {
      const configPath = getConfigPath(component.name);
      if (!fs.existsSync(configPath)) continue;

      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const componentLocation = findComponentLocation(
        component.name,
        process.cwd(),
        installPath,
        isExplicitPrefix,
      );

      if (!componentLocation) continue;

      const isMainInLegacy = componentLocation.needsCreation;

      // Check explicit dependencies (config.requires)
      const dependencies = config.requires ?? [];
      for (const depName of dependencies) {
        const depLocation = findComponentLocation(
          depName,
          process.cwd(),
          installPath,
          isExplicitPrefix,
        );

        if (!depLocation) continue;

        const isDepInLegacy = depLocation.needsCreation;

        if (isMainInLegacy !== isDepInLegacy) {
          inconsistencies.push({
            main: component.name,
            mainLocation: isMainInLegacy ? "ui" : "tambo",
            dependency: depName,
            depLocation: isDepInLegacy ? "ui" : "tambo",
          });
        }
      }

      // Check support files
      const files = config.files ?? [];
      for (const file of files) {
        if (
          file.name.endsWith(".tsx") &&
          file.name !== `${component.name}.tsx`
        ) {
          const supportComponentName = path.basename(file.name, ".tsx");
          const supportLocation = findComponentLocation(
            supportComponentName,
            process.cwd(),
            installPath,
            isExplicitPrefix,
          );

          if (!supportLocation) continue;

          const isSupportInLegacy = supportLocation.needsCreation;

          if (isMainInLegacy !== isSupportInLegacy) {
            inconsistencies.push({
              main: component.name,
              mainLocation: isMainInLegacy ? "ui" : "tambo",
              dependency: supportComponentName,
              depLocation: isSupportInLegacy ? "ui" : "tambo",
            });
          }
        }
      }
    } catch {
      continue;
    }
  }

  // Remove duplicates
  return inconsistencies.filter(
    (item, index, array) =>
      array.findIndex(
        (i) => i.main === item.main && i.dependency === item.dependency,
      ) === index,
  );
}

/**
 * Handles dependency inconsistencies and migration decisions
 * @param inconsistencies - Found dependency inconsistencies
 * @param legacyComponents - Components in legacy location
 * @param installPath - Base installation path
 * @param actionType - Type of action being performed ("upgrade" or "update")
 * @returns Whether migration should be performed
 */
export async function handleDependencyInconsistencies(
  inconsistencies: DependencyInconsistency[],
  legacyComponents: string[],
  installPath: string,
  actionType: "upgrade" | "update" = "update",
): Promise<boolean> {
  if (inconsistencies.length === 0) return false;

  console.log(chalk.red("\n❌ Mixed component locations detected:"));
  inconsistencies.forEach((issue) => {
    console.log(
      chalk.yellow(
        `  • ${issue.main} (in ${issue.mainLocation}/) depends on ${issue.dependency} (in ${issue.depLocation}/)`,
      ),
    );
  });

  console.log(
    chalk.blue(
      "\n💡 This can cause import path issues. We strongly recommend migration.",
    ),
  );

  const forceMigration = await confirmAction(
    `Would you like to migrate ALL components to resolve these inconsistencies before ${actionType}?`,
    true,
  );

  if (forceMigration) {
    await migrateComponentsDuringUpgrade(legacyComponents, installPath);
    return true;
  }

  console.log(
    chalk.yellow(
      `\n⚠️  Proceeding with mixed locations. Some manual import fixes may be needed after ${actionType}.`,
    ),
  );
  return false;
}
