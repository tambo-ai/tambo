/**
 * Verification checks for executed file operations
 *
 * Validates that files were created successfully, have content,
 * and pass basic syntax checks.
 */

import fs from "node:fs/promises";
import type { FileOperation, VerificationError } from "./types.js";

/**
 * Verifies that file operations completed successfully.
 * Checks file existence, readability, content, and basic syntax.
 *
 * @param operations - Array of file operations to verify
 * @returns Array of verification errors (empty if all checks pass)
 */
export async function verifyExecution(
  operations: FileOperation[],
): Promise<VerificationError[]> {
  const errors: VerificationError[] = [];

  for (const operation of operations) {
    const { filePath } = operation;

    // Check 1: File exists
    try {
      await fs.access(filePath, fs.constants.F_OK);
    } catch {
      errors.push({
        filePath,
        issue: "File was not created",
        suggestion: "Check file write permissions and disk space",
      });
      continue; // Skip remaining checks if file doesn't exist
    }

    // Check 2: File is readable
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch {
      errors.push({
        filePath,
        issue: "File exists but is not readable",
        suggestion: "Check file permissions",
      });
      continue; // Skip remaining checks if file isn't readable
    }

    // Check 3: Read content and verify non-empty
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch (err) {
      errors.push({
        filePath,
        issue: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        suggestion: "Check file permissions and disk space",
      });
      continue;
    }

    if (content.length === 0) {
      errors.push({
        filePath,
        issue: "File is empty",
        suggestion: "Content generation may have failed",
      });
      continue;
    }

    // Remaining checks are for TypeScript/TSX files only
    const isTypeScriptFile =
      filePath.endsWith(".ts") || filePath.endsWith(".tsx");
    if (!isTypeScriptFile) {
      continue;
    }

    // Check 4: Balanced braces for .ts/.tsx files
    const openBraces = (content.match(/\{/g) ?? []).length;
    const closeBraces = (content.match(/\}/g) ?? []).length;

    if (openBraces !== closeBraces) {
      errors.push({
        filePath,
        issue: `Unbalanced braces (${openBraces} open, ${closeBraces} close)`,
        suggestion: "Check file syntax with: npx tsc --noEmit",
      });
    }

    // Check 5: .tsx files should have imports
    if (filePath.endsWith(".tsx")) {
      const hasImport = /^import\s+/m.test(content);
      if (!hasImport) {
        errors.push({
          filePath,
          issue: "React component missing imports",
          suggestion: "Add necessary import statements (e.g., React, types)",
        });
      }
    }

    // Check 6: Files should have exports
    const hasExport = /^export\s+/m.test(content);
    if (!hasExport) {
      errors.push({
        filePath,
        issue: "File has no exports",
        suggestion: "Add export statement to make code accessible",
      });
    }
  }

  return errors;
}
