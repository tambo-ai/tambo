import fs from "fs";
import path from "path";
import { interactivePrompt } from "./interactive.js";
import chalk from "chalk";

export interface WriteEnvVarResult {
  success: boolean;
  filePath: string;
  overwrote: boolean;
}

export interface WriteEnvVarOptions {
  /**
   * If true, prompt user before overwriting existing values.
   * If false, silently overwrite.
   */
  promptOverwrite?: boolean;
}

/**
 * Writes an environment variable to a .env file with proper framework prefix.
 *
 * Logic:
 * - Prefers .env.local, falls back to .env if it exists
 * - Creates .env.local if neither file exists
 * - Checks if key already exists (with regex)
 * - Optionally prompts for confirmation before overwriting
 * - Returns detailed result about the operation
 *
 * @param projectRoot - Project root directory
 * @param key - Environment variable key (without prefix)
 * @param value - Environment variable value
 * @param prefix - Framework-specific prefix (e.g., "NEXT_PUBLIC_")
 * @param options - Additional options for behavior customization
 * @returns Result of the write operation
 *
 * @example
 * const result = await writeEnvVar(
 *   process.cwd(),
 *   "TAMBO_API_KEY",
 *   "tam_123456",
 *   "NEXT_PUBLIC_",
 *   { promptOverwrite: true }
 * );
 */
export async function writeEnvVar(
  projectRoot: string,
  key: string,
  value: string,
  prefix: string,
  options: WriteEnvVarOptions = {},
): Promise<WriteEnvVarResult> {
  const { promptOverwrite = true } = options;
  const fullKey = `${prefix}${key}`;

  // Determine target file
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envPath = path.join(projectRoot, ".env");

  let targetFile: string;
  if (fs.existsSync(envLocalPath)) {
    targetFile = envLocalPath;
  } else if (fs.existsSync(envPath)) {
    targetFile = envPath;
  } else {
    // Create .env.local if neither exists
    targetFile = envLocalPath;
  }

  // Check if key already exists
  let existingContent = "";
  let keyExists = false;

  if (fs.existsSync(targetFile)) {
    existingContent = fs.readFileSync(targetFile, "utf-8");
    // Escape special regex characters in the key
    const escapedKey = fullKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const keyRegex = new RegExp(`^${escapedKey}=.*$`, "m");
    keyExists = keyRegex.test(existingContent);
  }

  // Handle existing key
  if (keyExists && promptOverwrite) {
    const { shouldOverwrite } = await interactivePrompt<{
      shouldOverwrite: boolean;
    }>(
      {
        type: "confirm",
        name: "shouldOverwrite",
        message: chalk.yellow(
          `⚠️  ${fullKey} already exists in ${path.basename(targetFile)}. Overwrite?`,
        ),
        default: false,
      },
      chalk.yellow(
        `Cannot prompt for overwrite confirmation in non-interactive mode. Keeping existing ${fullKey} value.`,
      ),
    );

    if (!shouldOverwrite) {
      return {
        success: false,
        filePath: targetFile,
        overwrote: false,
      };
    }
  }

  // Write or update the value
  try {
    if (!fs.existsSync(targetFile)) {
      // Create new file with header
      const content = `# Environment Variables\n${fullKey}=${value}\n`;
      fs.writeFileSync(targetFile, content, "utf-8");
    } else if (keyExists) {
      // Replace existing value
      const escapedKey = fullKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const keyRegex = new RegExp(`^${escapedKey}=.*$`, "m");
      const updatedContent = existingContent.replace(
        keyRegex,
        `${fullKey}=${value}`,
      );
      fs.writeFileSync(targetFile, updatedContent, "utf-8");
    } else {
      // Append new key
      const newLine = existingContent.endsWith("\n") ? "" : "\n";
      fs.appendFileSync(targetFile, `${newLine}${fullKey}=${value}\n`, "utf-8");
    }

    return {
      success: true,
      filePath: targetFile,
      overwrote: keyExists,
    };
  } catch (error) {
    throw new Error(
      `Failed to write ${fullKey} to ${targetFile}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
