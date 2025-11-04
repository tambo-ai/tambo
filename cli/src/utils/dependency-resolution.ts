import fs from "fs";
import chalk from "chalk";
import type { ComponentConfig } from "../commands/add/types.js";
import { componentExists, getConfigPath } from "../commands/add/utils.js";
import { findComponentLocation } from "../commands/shared/component-utils.js";

/**
 * Result of resolving component dependencies
 */
export interface DependencyResolutionResult {
  /** Map of component names to their dependencies */
  dependencyMap: Map<string, string[]>;
  /** All components that need to be processed (including dependencies) */
  allComponents: Set<string>;
  /** Dependencies that are already installed */
  installedDependencies: string[];
  /** Dependencies that need to be installed */
  missingDependencies: string[];
}

/**
 * Resolves all dependencies for a component
 * @param componentName The name of the component
 * @param visited Set of already visited components to prevent circular dependencies
 * @returns Array of component names in dependency order
 */
export async function resolveComponentDependencies(
  componentName: string,
  visited = new Set<string>(),
): Promise<string[]> {
  if (visited.has(componentName)) {
    return [];
  }
  visited.add(componentName);

  const configPath = getConfigPath(componentName);

  if (!componentExists(componentName)) {
    throw new Error(
      `Component ${componentName} not found in registry at ${configPath}`,
    );
  }

  const config: ComponentConfig = JSON.parse(
    fs.readFileSync(configPath, "utf-8"),
  );
  const dependencies = config.requires ?? [];

  const resolvedDeps = new Set<string>();

  // Add direct dependencies
  dependencies.forEach((dep) => resolvedDeps.add(dep));

  // Recursively resolve nested dependencies
  for (const dep of dependencies) {
    const nestedDeps = await resolveComponentDependencies(dep, visited);
    nestedDeps.forEach((nestedDep) => resolvedDeps.add(nestedDep));
  }

  return [componentName, ...Array.from(resolvedDeps)];
}

/**
 * Resolves dependencies for multiple components and categorizes them
 * @param components - Components to resolve dependencies for
 * @param installedComponents - Set of already installed components
 * @param options - Options for displaying dependency information
 * @returns Resolved dependency information
 */
export async function resolveDependenciesForComponents(
  components: { name: string; installPath: string }[],
  installedComponents: Set<string>,
  options: { silent?: boolean } = {},
): Promise<DependencyResolutionResult> {
  const allComponents = new Set<string>();
  const dependencyMap = new Map<string, string[]>();

  for (const component of components) {
    allComponents.add(component.name);
    try {
      const resolved = await resolveComponentDependencies(component.name);
      const dependencies = resolved.filter((dep) => dep !== component.name);

      if (dependencies.length > 0) {
        dependencyMap.set(component.name, dependencies);
        dependencies.forEach((dep) => allComponents.add(dep));
      }
    } catch (error) {
      if (!options.silent) {
        console.log(
          chalk.yellow(
            `⚠️  Failed to resolve dependencies for ${component.name}: ${error}`,
          ),
        );
      }
    }
  }

  // Split dependencies into already installed and missing
  const installedDependencies = Array.from(allComponents).filter((comp) =>
    installedComponents.has(comp),
  );
  const missingDependencies = Array.from(allComponents).filter(
    (comp) => !installedComponents.has(comp),
  );

  return {
    dependencyMap,
    allComponents,
    installedDependencies,
    missingDependencies,
  };
}

/**
 * Displays dependency information to the user
 * @param result - Dependency resolution result
 * @param originalComponents - Original components requested
 */
export function displayDependencyInfo(
  result: DependencyResolutionResult,
  originalComponents: { name: string; installPath: string }[],
): void {
  const { dependencyMap, installedDependencies, missingDependencies } = result;

  // Show already installed dependencies being included
  if (installedDependencies.length > originalComponents.length) {
    const addedDeps = installedDependencies.filter(
      (dep) => !originalComponents.find((c) => c.name === dep),
    );
    if (addedDeps.length > 0) {
      console.log(
        chalk.blue("\n📦 Including installed dependencies in update:"),
      );
      addedDeps.forEach((dep) => {
        const requiredBy = Array.from(dependencyMap.entries())
          .filter(([, deps]) => deps.includes(dep))
          .map(([comp]) => comp);
        console.log(`    - ${dep} (required by: ${requiredBy.join(", ")})`);
      });
    }
  }

  // Show dependencies that need to be installed
  if (missingDependencies.length > 0) {
    console.log(chalk.blue("\n📦 Installing missing dependencies:"));
    missingDependencies.forEach((dep) => {
      const requiredBy = Array.from(dependencyMap.entries())
        .filter(([, deps]) => deps.includes(dep))
        .map(([comp]) => comp);
      console.log(`    - ${dep} (required by: ${requiredBy.join(", ")})`);
    });
  }
}

/**
 * Expands components list to include all dependencies with their locations
 * @param originalComponents - Original components to expand
 * @param result - Dependency resolution result
 * @param projectRoot - Project root directory
 * @param installPath - Base installation path
 * @param isExplicitPrefix - Whether installPath was explicitly provided
 * @returns Expanded list of components with install paths
 */
export async function expandComponentsWithDependencies(
  originalComponents: { name: string; installPath: string }[],
  result: DependencyResolutionResult,
  projectRoot: string,
  installPath: string,
  isExplicitPrefix: boolean,
): Promise<{ name: string; installPath: string }[]> {
  const { installedDependencies, missingDependencies } = result;
  const existingComponentNames = new Set(originalComponents.map((c) => c.name));
  const allDependencies = [...installedDependencies, ...missingDependencies];

  const expandedComponents = [...originalComponents];

  for (const depName of allDependencies) {
    if (!existingComponentNames.has(depName)) {
      // For already installed dependencies, find their current location
      const location = findComponentLocation(
        depName,
        projectRoot,
        installPath,
        isExplicitPrefix,
      );

      if (location) {
        // Dependency already exists, use its current location
        expandedComponents.push({
          name: depName,
          installPath: location.installPath,
        });
      } else {
        // Missing dependency, use the same base install path as existing components
        expandedComponents.push({
          name: depName,
          installPath: installPath,
        });
      }
    }
  }

  return expandedComponents;
}
