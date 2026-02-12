import fs from "fs";
import path from "path";

/**
 * Options for findFilesRecursively
 */
interface FindFilesOptions {
  /** Directories to exclude from search */
  exclude?: string[];
}

/**
 * Default directories to exclude from recursive searches
 */
const DEFAULT_EXCLUDES = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  "coverage",
];

/**
 * Recursively finds all files with specified extensions in a directory
 *
 * @param dir - Directory to search
 * @param extensions - File extensions to include (e.g., ['.ts', '.tsx'])
 * @param options - Optional configuration
 * @returns Array of absolute file paths
 */
export function findFilesRecursively(
  dir: string,
  extensions: string[],
  options: FindFilesOptions = {},
): string[] {
  const results: string[] = [];
  const exclude = [...DEFAULT_EXCLUDES, ...(options.exclude ?? [])];

  function walk(currentPath: string): void {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip excluded directories
      if (exclude.some((ex) => entry.name === ex || fullPath.includes(ex))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Finds the first existing file from a list of candidates
 *
 * @param candidates - Array of relative file paths to check
 * @param root - Root directory to resolve paths from
 * @returns Absolute path to first existing file, or null if none exist
 */
export function findFirstExisting(
  candidates: string[],
  root: string,
): string | null {
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Finds the first existing directory from a list of candidates
 *
 * @param candidates - Array of relative directory paths to check
 * @param root - Root directory to resolve paths from
 * @returns Absolute path to first existing directory, or null if none exist
 */
export function findDirectory(
  candidates: string[],
  root: string,
): string | null {
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return fullPath;
    }
  }
  return null;
}
