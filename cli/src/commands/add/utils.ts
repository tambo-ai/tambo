import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gets the registry path for a component
 * @param componentName The name of the component
 * @returns The path to the component in the registry
 */
export function getRegistryPath(componentName: string): string {
  return path.join(__dirname, "../../../src/registry", componentName);
}

/**
 * Gets the config path for a component
 * @param componentName The name of the component
 * @returns The path to the component's config file
 */
export function getConfigPath(componentName: string): string {
  return path.join(getRegistryPath(componentName), "config.json");
}

/**
 * Checks if a component exists in the registry
 * @param componentName The name of the component to check
 * @returns True if the component exists, false otherwise
 */
export function componentExists(componentName: string): boolean {
  return fs.existsSync(getConfigPath(componentName));
}
