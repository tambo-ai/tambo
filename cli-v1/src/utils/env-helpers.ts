/**
 * Environment file helpers for tambov1 CLI
 *
 * Shared utilities for writing API keys to .env files.
 */

import fs from "fs";

import {
  findTamboApiKey,
  setTamboApiKey,
  type TamboApiKeyName,
} from "./dotenv-utils.js";
import {
  detectFramework,
  getTamboApiKeyEnvVar,
} from "./framework-detection.js";

import { out } from "./output.js";

/**
 * Result of writing an API key to an env file.
 */
export interface WriteApiKeyResult {
  envFile: string;
  created: boolean;
  modified: boolean;
}

/**
 * Options for writeApiKeyToEnv function.
 */
export interface WriteApiKeyOptions {
  /** Whether to suppress console output (for JSON mode) */
  jsonMode: boolean;
  /** Callback when a file is created */
  onFileCreated?: (file: string) => void;
  /** Callback when a file is modified */
  onFileModified?: (file: string) => void;
}

/**
 * Writes an API key to the appropriate .env file.
 *
 * This function:
 * 1. Determines the target env file (.env.local preferred, falls back to .env)
 * 2. Detects the framework to use the appropriate env var name
 * 3. Creates or updates the env file with the API key
 * 4. Handles existing keys (warns and overwrites)
 *
 * @param apiKey - The API key to write
 * @param options - Configuration options
 * @returns Information about what was written and where
 */
export function writeApiKeyToEnv(
  apiKey: string,
  options: WriteApiKeyOptions
): WriteApiKeyResult {
  const { jsonMode, onFileCreated, onFileModified } = options;

  // Determine target file
  let targetEnvFile = ".env.local";
  if (fs.existsSync(".env") && !fs.existsSync(".env.local")) {
    targetEnvFile = ".env";
  }

  // Detect framework and get env var name
  const framework = detectFramework();
  const envVarName = getTamboApiKeyEnvVar() as TamboApiKeyName;

  if (framework && !jsonMode) {
    out.info(`Detected ${framework.displayName} project`);
  }

  const result: WriteApiKeyResult = {
    envFile: targetEnvFile,
    created: false,
    modified: false,
  };

  if (!fs.existsSync(targetEnvFile)) {
    // Create new env file
    fs.writeFileSync(
      targetEnvFile,
      `# Environment Variables\n${envVarName}=${apiKey.trim()}\n`
    );
    result.created = true;
    onFileCreated?.(targetEnvFile);

    if (!jsonMode) {
      out.success(`Created ${targetEnvFile} with API key`);
    }
  } else {
    // Update existing env file
    const existingContent = fs.readFileSync(targetEnvFile, "utf8");
    const existingKey = findTamboApiKey(existingContent);

    if (existingKey && !jsonMode) {
      out.warning(`Existing API key found (${existingKey.keyName}). Overwriting...`);
    }

    const updatedContent = setTamboApiKey(existingContent, envVarName, apiKey.trim());
    fs.writeFileSync(targetEnvFile, updatedContent);
    result.modified = true;
    onFileModified?.(targetEnvFile);

    if (!jsonMode) {
      out.success(`Updated ${targetEnvFile} with API key as ${envVarName}`);
    }
  }

  return result;
}
