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

interface ComponentInfo {
  name: string;
  description: string;
  componentName: string;
}

/**
 * Gets a list of all available components with their descriptions and component names
 * @returns An array of ComponentInfo objects
 */
export function getComponentList(): ComponentInfo[] {
  const registryPath = path.join(__dirname, "../../../src/registry");
  const components = fs
    .readdirSync(registryPath)
    .filter((file) => fs.statSync(path.join(registryPath, file)).isDirectory())
    .filter((dir) => dir !== "config");

  return components
    .map((componentName) => {
      const configPath = getConfigPath(componentName);
      if (!fs.existsSync(configPath)) {
        return null;
      }
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      return {
        name: componentName,
        description: config.description ?? "No description available",
        componentName: config.componentName ?? componentName,
      };
    })
    .filter((component) => component !== null);
}

/**
 * Gets a list of all installed component names in the project
 * @param installPath The installation path for components
 * @returns An array of installed component names (tambo components only)
 */
export async function getInstalledComponents(
  installPath: string,
): Promise<string[]> {
  try {
    const componentsPath = path.join(process.cwd(), installPath, "ui");

    if (!fs.existsSync(componentsPath)) {
      return [];
    }

    const files = fs.readdirSync(componentsPath);
    const components = files
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => file.replace(".tsx", ""))
      .filter((componentName) => componentExists(componentName)); // Only return tambo components

    return components;
  } catch (_error) {
    return [];
  }
}
