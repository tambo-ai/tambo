import fs from "fs";
import path from "path";
import semver from "semver";

/**
 * Detects the Tailwind CSS version from package.json
 * @param projectRoot The root directory of the project
 * @returns The Tailwind CSS version or null if not found
 */
export function detectTailwindVersion(projectRoot: string): string | null {
  try {
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const tailwindVersion =
      packageJson.dependencies?.tailwindcss ??
      packageJson.devDependencies?.tailwindcss;

    if (!tailwindVersion) {
      return null;
    }

    // Extract version number from version string (e.g., "^4.0.0" -> "4.0.0")
    const cleanVersion =
      semver.clean(tailwindVersion) ?? semver.coerce(tailwindVersion)?.version;

    return cleanVersion ?? null;
  } catch (error) {
    console.warn(`Warning: Could not detect Tailwind version: ${error}`);
    return null;
  }
}

/**
 * Checks if the given version is Tailwind v4 or later
 */
export function isV4OrLater(version: string | null): boolean {
  return version ? semver.gte(version, "4.0.0") : false;
}
