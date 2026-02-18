/**
 * Copies the component registry from packages/ui-registry/src/ to cli/dist/registry/
 * This script runs as part of the CLI build process.
 *
 * The registry files are copied with their original @tambo-ai/ui-registry/* imports
 * intact - these are transformed at runtime when users run `tambo add`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_ROOT = path.resolve(__dirname, "..");
const UI_REGISTRY_SRC = path.resolve(CLI_ROOT, "../packages/ui-registry/src");
const DIST_REGISTRY = path.resolve(CLI_ROOT, "dist/registry");

/**
 * Checks if a file should be copied based on its extension
 */
function shouldCopyFile(filename: string): boolean {
  const includeExtensions = [".ts", ".tsx", ".css", ".json"];

  if (filename.includes(".test.")) {
    return false;
  }

  return includeExtensions.some((ext) => filename.endsWith(ext));
}

/**
 * Recursively copies a directory, filtering files based on shouldCopyFile
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else if (entry.isFile() && shouldCopyFile(entry.name)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Removes empty directories recursively
 */
function removeEmptyDirs(dir: string): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name));
    }
  }

  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    fs.rmdirSync(dir);
  }
}

function main(): void {
  console.log("Copying registry from ui-registry package...");

  if (!fs.existsSync(UI_REGISTRY_SRC)) {
    throw new Error(
      `ui-registry source not found at ${UI_REGISTRY_SRC}. ` +
        `Make sure packages/ui-registry exists.`,
    );
  }

  if (fs.existsSync(DIST_REGISTRY)) {
    fs.rmSync(DIST_REGISTRY, { recursive: true });
  }

  const componentsDir = path.join(UI_REGISTRY_SRC, "components");
  if (fs.existsSync(componentsDir)) {
    copyDirectory(componentsDir, path.join(DIST_REGISTRY, "components"));
    console.log("  ✓ Copied components/");
  }

  const libDir = path.join(UI_REGISTRY_SRC, "lib");
  if (fs.existsSync(libDir)) {
    copyDirectory(libDir, path.join(DIST_REGISTRY, "lib"));
    console.log("  ✓ Copied lib/");
  }

  const stylesDir = path.join(UI_REGISTRY_SRC, "styles");
  if (fs.existsSync(stylesDir)) {
    copyDirectory(stylesDir, path.join(DIST_REGISTRY, "styles"));
    console.log("  ✓ Copied styles/");
  }

  const utilsFile = path.join(UI_REGISTRY_SRC, "utils.ts");
  if (fs.existsSync(utilsFile)) {
    fs.copyFileSync(utilsFile, path.join(DIST_REGISTRY, "utils.ts"));
    console.log("  ✓ Copied utils.ts");
  }

  removeEmptyDirs(DIST_REGISTRY);

  console.log(`\nRegistry copied to ${DIST_REGISTRY}`);
}

main();
