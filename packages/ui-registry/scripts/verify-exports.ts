#!/usr/bin/env npx tsx
/**
 * CLI entrypoint for verifying the component registry integrity.
 */

import fs from "node:fs";

import {
  COMPONENTS_DIR,
  type MissingRequiresError,
  type UnresolvedImportError,
  getComponentDirectories,
  getComponentNames,
  getPackageExports,
  validateComponentRequires,
  validateRelativeImports,
  verifyComponentsHaveExports,
  verifyExportsPointToFiles,
} from "./verify-exports.lib.js";

if (process.platform === "win32") {
  console.error(
    "verify-exports is not supported on Windows. Run this check in a Linux/macOS environment.",
  );
  process.exit(1);
}

function main(): void {
  console.log("Verifying component registry...\n");

  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error(`Components directory not found: ${COMPONENTS_DIR}`);
    process.exit(1);
  }

  const exports = getPackageExports();
  const componentDirs = getComponentDirectories();
  const knownComponents = getComponentNames();

  const exportErrors: string[] = [
    ...verifyExportsPointToFiles(exports),
    ...verifyComponentsHaveExports(exports, componentDirs),
  ];

  const requiresErrors: MissingRequiresError[] = [];
  const importErrors: UnresolvedImportError[] = [];

  for (const componentName of knownComponents) {
    requiresErrors.push(
      ...validateComponentRequires(componentName, knownComponents),
    );
    importErrors.push(...validateRelativeImports(componentName));
  }

  let hasErrors = false;

  if (exportErrors.length > 0) {
    hasErrors = true;
    console.error("Export verification failed:\n");
    exportErrors.forEach((error) => console.error(`  - ${error}`));
    console.error("\n");
  }

  if (requiresErrors.length > 0) {
    hasErrors = true;
    console.error("Missing requires entries:\n");
    for (const error of requiresErrors) {
      console.error(
        `  ${error.component}/config.json: Missing "${error.referencedComponent}" in requires`,
      );
      console.error(
        `    File "${error.file}" references ${error.referencedComponent}\n`,
      );
    }
    console.error(
      `To fix: Add the missing component names to the "requires" array in each config.json\n`,
    );
  }

  if (importErrors.length > 0) {
    hasErrors = true;
    console.error("Unresolved relative imports:\n");
    for (const error of importErrors) {
      console.error(
        `  ${error.component}/${error.file}: Cannot resolve import '${error.importPath}'`,
      );
    }
    console.error(
      `\nTo fix: Ensure the imported files exist in the component directory\n`,
    );
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log(`All ${exports.size} exports verified`);
  console.log(`All ${componentDirs.length} components have exports`);
  console.log(`All ${knownComponents.size} components have valid requires`);
  console.log("\nVerification passed!");
}

main();
