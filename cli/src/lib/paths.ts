import envPaths from "env-paths";
import { join } from "node:path";

/**
 * Name of directory to store state/config/cache
 */
const DIR_PREFIX = "tambo";

/**
 * Explicit mapping of directory types to XDG environment variables.
 * Using explicit strings rather than dynamic construction for security
 * and to make these searchable in the codebase.
 */
const XDG_ENV_VARS = {
  cache: "XDG_CACHE_HOME",
  config: "XDG_CONFIG_HOME",
  data: "XDG_DATA_HOME",
} as const;

/**
 * Get OS-specific paths for tambo state storage.
 * Uses XDG Base Directory Specification on Linux.
 *
 * @returns The directory path for the requested type
 */
export function getDir(type: keyof typeof XDG_ENV_VARS): string {
  const envKey = XDG_ENV_VARS[type];
  const xdgDir = process.env[envKey];
  if (xdgDir) {
    return join(xdgDir, DIR_PREFIX);
  }
  const paths = envPaths(DIR_PREFIX, { suffix: "" });
  return paths[type];
}
