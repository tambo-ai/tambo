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
    // Anchor explicit prefixes within the project root to avoid writes outside the repo
    // Resolve against projectRoot (handles absolute and relative inputs uniformly)
    const absolute = path.resolve(projectRoot, installPath);
    const rel = path.relative(projectRoot, absolute);
    // Reject any path that escapes the project root (covers different-drive cases on Windows)
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(
        `Prefix must be within the project root: ${projectRoot} (got ${installPath})`,
      );
    }
    return absolute;
  }
  // Non-explicit: compute path relative to project root and validate it doesn't escape
  const base = path.resolve(projectRoot, installPath, COMPONENT_SUBDIR);
  const relBase = path.relative(projectRoot, base);
  if (relBase.startsWith("..") || path.isAbsolute(relBase)) {
    throw new Error(
      `Computed component directory escapes the project root: ${projectRoot} (got ${installPath})`,
    );
  }
  return base;
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
    // Resolve explicit prefix relative to the project root (handles absolute and relative)
    const resolved = path.isAbsolute(installPath)
      ? installPath
      : path.resolve(projectRoot, installPath);
    const rel = path.relative(projectRoot, resolved);

    // If the explicit prefix is under src/ (or exactly src), place tambo.ts in src/lib
    const startsInSrc = rel === "src" || rel.startsWith(`src${path.sep}`);
    return startsInSrc
      ? path.join(projectRoot, "src", "lib")
      : path.join(projectRoot, "lib");
  }

  // For auto-detected paths, use parent directory of installPath
  // Example: "src/components" -> src/lib, "components" -> <root>/lib
  const parent = path.dirname(installPath);
  return parent === "." || parent === ""
    ? path.join(projectRoot, "lib")
    : path.join(projectRoot, parent, "lib");
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
