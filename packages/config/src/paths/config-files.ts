import { existsSync } from "fs";
import { join } from "path";
import { getConfigFilePath } from "./xdg";

/**
 * Config file names in order of preference.
 * First match wins within each scope (local/user).
 */
const CONFIG_FILENAMES = [
  "tambo.config.ts", // TypeScript (best IDE support)
  "tambo.config.js", // JavaScript
  "tambo.config.yaml", // YAML
  "tambo.config.yml", // YAML alt
  "tambo.config.json", // JSON
  ".tamborc", // RC file (JSON)
  ".tamborc.yaml", // RC file (YAML)
  ".tamborc.yml", // RC file (YAML alt)
  ".tamborc.json", // RC file (JSON)
];

export type ConfigFileType = "typescript" | "javascript" | "yaml" | "json";
export type ConfigFileScope = "local" | "user";

export interface ConfigFileLocation {
  path: string;
  type: ConfigFileType;
  scope: ConfigFileScope;
}

function getConfigType(filename: string): ConfigFileType {
  if (filename.endsWith(".ts")) return "typescript";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  return "json";
}

/**
 * Find config files in order of precedence.
 *
 * Returns configs grouped by scope:
 * - local: project directory (./tambo.config.*)
 * - user: user config directory (~/.config/tambo/tambo.config.*)
 *
 * Within each scope, only the first matching file is returned.
 */
export function findConfigFiles(
  cwd: string = process.cwd(),
): ConfigFileLocation[] {
  const found: ConfigFileLocation[] = [];

  // Check local directory (project-specific)
  for (const filename of CONFIG_FILENAMES) {
    const localPath = join(cwd, filename);
    if (existsSync(localPath)) {
      found.push({
        path: localPath,
        type: getConfigType(filename),
        scope: "local",
      });
      break; // Only use first match in local scope
    }
  }

  // Check user config directory
  for (const filename of CONFIG_FILENAMES) {
    const userPath = getConfigFilePath(filename);
    if (existsSync(userPath)) {
      found.push({
        path: userPath,
        type: getConfigType(filename),
        scope: "user",
      });
      break; // Only use first match in user scope
    }
  }

  return found;
}

/**
 * Get the local config file (project directory).
 */
export function findLocalConfig(cwd?: string): ConfigFileLocation | null {
  const configs = findConfigFiles(cwd);
  return configs.find((c) => c.scope === "local") ?? null;
}

/**
 * Get the user config file (~/.config/tambo).
 */
export function findUserConfig(cwd?: string): ConfigFileLocation | null {
  const configs = findConfigFiles(cwd);
  return configs.find((c) => c.scope === "user") ?? null;
}

/**
 * Get all supported config filenames.
 * Useful for documentation or file watchers.
 */
export function getSupportedConfigFilenames(): readonly string[] {
  return CONFIG_FILENAMES;
}
