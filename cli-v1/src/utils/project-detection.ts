import fs from "fs";
import path from "path";

import { isTokenValid, verifySession } from "../lib/device-auth.js";
import { findTamboApiKey } from "./dotenv-utils.js";

import { detectPackageManager, type PackageManager } from "./package-manager.js";
import { getComponentDirectoryPath, getLibDirectory } from "./path-utils.js";

export interface ProjectStatus {
  hasPackageJson: boolean;
  packageManager: PackageManager;
  hasTamboReact: boolean;
  authenticated: boolean;
  hasApiKey: boolean;
  hasTamboTs: boolean;
  hasAgentDocs: boolean;
}

function readPackageJsonDependencies(cwd: string): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  try {
    const content = fs.readFileSync(path.join(cwd, "package.json"), "utf8");
    const parsed = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

function hasApiKeyInEnv(cwd: string): boolean {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.join(cwd, file);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    if (findTamboApiKey(content)) {
      return true;
    }
  }
  return false;
}

async function hasValidSession(): Promise<boolean> {
  if (!isTokenValid()) {
    return false;
  }
  try {
    return await verifySession();
  } catch {
    return false;
  }
}

export async function detectProjectStatus(
  cwd: string,
  prefix: string,
): Promise<ProjectStatus> {
  const hasPackageJson = fs.existsSync(path.join(cwd, "package.json"));
  const packageManager = detectPackageManager(cwd);
  const { dependencies, devDependencies } = hasPackageJson
    ? readPackageJsonDependencies(cwd)
    : { dependencies: {}, devDependencies: {} };
  const hasTamboReact =
    "@tambo-ai/react" in dependencies || "@tambo-ai/react" in devDependencies;
  const authenticated = await hasValidSession();
  const hasApiKey = hasApiKeyInEnv(cwd);
  const isExplicitPrefix = prefix !== "src/components";
  const libDir = getLibDirectory(cwd, prefix, isExplicitPrefix);
  const tamboTsPath = path.join(libDir, "tambo.ts");
  const hasTamboTs = fs.existsSync(tamboTsPath);
  // Check for SKILL.md in the component directory
  const componentDir = getComponentDirectoryPath(cwd, prefix, isExplicitPrefix);
  const hasAgentDocs = fs.existsSync(path.join(componentDir, "SKILL.md"));

  return {
    hasPackageJson,
    packageManager,
    hasTamboReact,
    authenticated,
    hasApiKey,
    hasTamboTs,
    hasAgentDocs,
  };
}
