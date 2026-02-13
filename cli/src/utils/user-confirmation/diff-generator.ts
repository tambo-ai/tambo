/**
 * Utilities for generating unified diffs between file versions
 */

import { createTwoFilesPatch } from "diff";
import fs from "node:fs/promises";
import type { FileDiff } from "./types.js";

/**
 * Generate a unified diff for a file modification
 *
 * @param filePath - Path to the file being modified
 * @param newContent - New content for the file
 * @returns Promise resolving to FileDiff with patch or isNew flag
 */
export async function generateFileDiff(
  filePath: string,
  newContent: string,
): Promise<FileDiff> {
  let oldContent: string;
  let isNew: boolean;

  try {
    // Try to read existing file
    oldContent = await fs.readFile(filePath, "utf-8");
    isNew = false;
  } catch (error) {
    // Check if error is ENOENT (file doesn't exist)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      // File doesn't exist - this is a new file
      oldContent = "";
      isNew = true;
    } else {
      // Re-throw other errors (permission denied, etc.)
      throw error;
    }
  }

  // Generate patch for existing files
  const patch = isNew
    ? ""
    : createTwoFilesPatch(
        filePath,
        filePath,
        oldContent,
        newContent,
        "Current",
        "After changes",
        { context: 3 },
      );

  return {
    filePath,
    isNew,
    oldContent,
    newContent,
    patch,
  };
}
