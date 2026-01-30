#!/usr/bin/env npx tsx
/**
 * Verifies that package.json exports match the actual filesystem.
 *
 * This script ensures:
 * 1. All exports in package.json point to files that exist
 * 2. All component directories have a corresponding export
 *
 * Run this in CI to prevent drift between exports and filesystem.
 */

import fs from "node:fs";
import path from "node:path";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(PACKAGE_ROOT, "src");

// Note: This interface only covers the exports field we need.
// The actual package.json has many more fields that we ignore here.
interface PackageJson {
  exports?: Record<string, string>;
}

function getPackageExports(): Map<string, string> {
  const packageJsonPath = path.join(PACKAGE_ROOT, "package.json");
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf-8"),
  );

  if (!packageJson.exports) {
    throw new Error("No exports field found in package.json");
  }

  return new Map(Object.entries(packageJson.exports));
}

function getComponentDirectories(): string[] {
  const componentsDir = path.join(SRC_DIR, "components");
  if (!fs.existsSync(componentsDir)) {
    return [];
  }

  return fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

function verifyExportsPointToFiles(exports: Map<string, string>): string[] {
  const errors: string[] = [];

  for (const [exportPath, filePath] of exports) {
    const fullPath = path.join(PACKAGE_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      errors.push(
        `Export "${exportPath}" points to non-existent file: ${filePath}`,
      );
    }
  }

  return errors;
}

function verifyComponentsHaveExports(
  exports: Map<string, string>,
  components: string[],
): string[] {
  const errors: string[] = [];

  for (const component of components) {
    const expectedExport = `./components/${component}`;
    if (!exports.has(expectedExport)) {
      errors.push(
        `Component directory "${component}" has no corresponding export "${expectedExport}"`,
      );
    }
  }

  return errors;
}

function main(): void {
  console.log("Verifying package.json exports match filesystem...\n");

  const exports = getPackageExports();
  const componentDirs = getComponentDirectories();

  const errors: string[] = [
    ...verifyExportsPointToFiles(exports),
    ...verifyComponentsHaveExports(exports, componentDirs),
  ];

  if (errors.length > 0) {
    console.error("Verification failed:\n");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\n");
    process.exit(1);
  }

  console.log(`All ${exports.size} exports verified`);
  console.log(`All ${componentDirs.length} components have exports`);
  console.log("\nVerification passed!");
}

main();
