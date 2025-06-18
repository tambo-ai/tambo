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
 * Checks if a component exists in the registry with a valid config
 * @param componentName The name of the component to check
 * @returns True if the component exists with valid config, false otherwise
 */
export function componentExists(componentName: string): boolean {
  try {
    const configPath = getConfigPath(componentName);
    if (!fs.existsSync(configPath)) {
      return false;
    }

    // Try to parse the config to ensure it's valid JSON
    const configContent = fs.readFileSync(configPath, "utf-8");
    JSON.parse(configContent);
    return true;
  } catch (_error) {
    return false;
  }
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
 * Gets a set of all known tambo registry component names
 * @returns A Set of component names that exist in the registry
 */
export function getKnownComponentNames(): Set<string> {
  try {
    const registryPath = path.join(__dirname, "../../../src/registry");
    if (!fs.existsSync(registryPath)) {
      return new Set();
    }

    const components = fs
      .readdirSync(registryPath)
      .filter((file) => {
        const fullPath = path.join(registryPath, file);
        return fs.statSync(fullPath).isDirectory() && file !== "config";
      })
      .filter((componentName) => componentExists(componentName));

    return new Set(components);
  } catch (_error) {
    return new Set();
  }
}

/**
 * Gets a list of all installed component names in the project
 * @param installPath The installation path for components
 * @param isExplicitPrefix Whether the installPath was explicitly provided via --prefix
 * @returns An array of installed component names (only tambo registry components)
 */
export async function getInstalledComponents(
  installPath: string,
  isExplicitPrefix = false,
): Promise<string[]> {
  try {
    const componentsPath = isExplicitPrefix
      ? path.join(process.cwd(), installPath)
      : path.join(process.cwd(), installPath, "ui");

    if (!fs.existsSync(componentsPath)) {
      return [];
    }

    // Get all known tambo components from the registry for validation
    const knownComponents = getKnownComponentNames();

    const files = fs.readdirSync(componentsPath);

    // Get all .tsx files and extract component names
    const allComponentNames = files
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => file.replace(".tsx", ""));

    // Filter to only include components that exist in the tambo registry
    // Use both checks: known components list and componentExists for extra validation
    const tamboComponents = allComponentNames.filter((componentName) => {
      return (
        knownComponents.has(componentName) && componentExists(componentName)
      );
    });

    return tamboComponents;
  } catch (_error) {
    return [];
  }
}
