import fs from "fs";
import type { ComponentConfig } from "./types.js";
import { componentExists, getConfigPath } from "./utils.js";

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
