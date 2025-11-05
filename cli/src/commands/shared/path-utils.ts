import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";

/**
 * Builds the component directory path based on installation path and whether it's explicit
 * @param projectRoot - Project root directory
 * @param installPath - Base installation path
 * @param isExplicitPrefix - Whether the prefix is explicitly provided
 * @returns Path to the component directory
 */
export function getComponentDirectoryPath(
  projectRoot: string,
  installPath: string,
  isExplicitPrefix: boolean,
): string {
  if (isExplicitPrefix) {
    // If installPath is already absolute, return it as-is
    if (path.isAbsolute(installPath)) {
      return installPath;
    }
    // Otherwise, join with project root
    return path.join(projectRoot, installPath);
  }
  return path.join(projectRoot, installPath, COMPONENT_SUBDIR);
}

/**
 * Builds the legacy component directory path
 * @param projectRoot - Project root directory
 * @param installPath - Base installation path
 * @returns Path to the legacy component directory
 */
export function getLegacyComponentDirectoryPath(
  projectRoot: string,
  installPath: string,
): string {
  return path.join(projectRoot, installPath, LEGACY_COMPONENT_SUBDIR);
}

/**
 * Gets the path to a specific component file
 * @param componentDir - Component directory path
 * @param componentName - Name of the component
 * @returns Path to the component file
 */
export function getComponentFilePath(
  componentDir: string,
  componentName: string,
): string {
  return path.join(componentDir, `${componentName}.tsx`);
}

/**
 * Gets the lib directory path based on the install path and whether it's an explicit prefix
 * @param projectRoot - Project root directory
 * @param installPath - Component installation path
 * @param isExplicitPrefix - Whether the installPath was explicitly provided via --prefix
 * @returns The lib directory path
 */
export function getLibDirectory(
  projectRoot: string,
  installPath: string,
  isExplicitPrefix: boolean,
): string {
  if (isExplicitPrefix) {
    // For explicit prefix, check if it starts with 'src' as a whole directory
    const normalizedPath = path.normalize(installPath);
    const pathParts = normalizedPath.split(path.sep).filter((p) => p !== "");
    const firstSegment = pathParts.length > 0 ? pathParts[0] : "";

    if (firstSegment === "src") {
      return path.join(projectRoot, "src", "lib");
    }
    return path.join(projectRoot, "lib");
  }

  // For auto-detected paths, use the standard logic
  // lib directory is at the same level as the parent of installPath
  const installPathDir = path.dirname(installPath);
  if (installPathDir === "." || installPathDir === "") {
    return path.join(projectRoot, "lib");
  }
  return path.join(projectRoot, installPathDir, "lib");
}

/**
 * Resolves component file paths for both new and legacy locations
 * @param projectRoot - Project root directory
 * @param installPath - Base installation path
 * @param componentName - Name of the component
 * @param isExplicitPrefix - Whether the prefix is explicitly provided
 * @returns Object with file paths for new and legacy locations
 */
export function resolveComponentPaths(
  projectRoot: string,
  installPath: string,
  componentName: string,
  isExplicitPrefix: boolean,
): {
  newPath: string;
  legacyPath: string | null;
} {
  const newDir = getComponentDirectoryPath(
    projectRoot,
    installPath,
    isExplicitPrefix,
  );
  const newPath = getComponentFilePath(newDir, componentName);

  const legacyPath = isExplicitPrefix
    ? null
    : getComponentFilePath(
        getLegacyComponentDirectoryPath(projectRoot, installPath),
        componentName,
      );

  return {
    newPath,
    legacyPath,
  };
}
