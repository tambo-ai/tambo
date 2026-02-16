/**
 * Atomic file operations for code execution
 *
 * Provides safe file writing with temp+rename pattern, backup/restore
 * functionality, and sequential execution of file operations.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { BackupManifest, FileOperation } from "./types.js";

/**
 * Writes a file atomically using temp file + rename pattern.
 * Creates parent directories as needed.
 * Cleans up temp file on error.
 *
 * @param filePath - Absolute path to the file to write
 * @param content - Content to write to the file
 * @returns Promise that resolves when write is complete
 */
export async function writeFileAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const tempPath = path.join(dir, `.${basename}.${crypto.randomUUID()}.tmp`);

  try {
    // Create parent directories if they don't exist
    await fs.mkdir(dir, { recursive: true });

    // Write to temp file
    await fs.writeFile(tempPath, content, "utf-8");

    // Atomic rename to target path
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/**
 * Creates a backup of an existing file.
 * Skips if file doesn't exist (nothing to backup).
 * Records backup path in manifest for later restore/cleanup.
 *
 * @param filePath - Path to file to back up
 * @param manifest - Backup manifest to record the backup in
 * @returns Promise that resolves when backup is complete
 */
export async function createBackup(
  filePath: string,
  manifest: BackupManifest,
): Promise<void> {
  try {
    // Check if file exists
    await fs.access(filePath);
  } catch (err) {
    // File doesn't exist (ENOENT) - nothing to backup
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw err;
  }

  // Create backup in same directory
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const backupPath = path.join(
    dir,
    `.${basename}.backup.${manifest.timestamp}`,
  );

  await fs.copyFile(filePath, backupPath);

  // Record in manifest
  manifest.backups.set(filePath, backupPath);
}

/**
 * Restores backed-up files to their original locations.
 * Handles missing backup files gracefully (logs but doesn't throw).
 *
 * @param manifest - Backup manifest with file mappings
 * @returns Promise that resolves when all restores are complete
 */
export async function restoreBackups(manifest: BackupManifest): Promise<void> {
  for (const [originalPath, backupPath] of manifest.backups) {
    try {
      await fs.copyFile(backupPath, originalPath);
      console.log(`Restored: ${originalPath}`);
    } catch (err) {
      // Log but don't throw - backup might not exist
      console.warn(`Failed to restore ${originalPath}: ${err}`);
    }
  }
}

/**
 * Deletes all backup files from manifest.
 * Ignores errors silently (backup cleanup is non-critical).
 *
 * @param manifest - Backup manifest with backup file paths
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupBackups(manifest: BackupManifest): Promise<void> {
  for (const backupPath of manifest.backups.values()) {
    try {
      await fs.unlink(backupPath);
    } catch {
      // Ignore cleanup errors silently
    }
  }
}

/**
 * Executes a sequence of file operations.
 * Writes each file atomically in order.
 * Stops on first error.
 *
 * @param operations - Array of file operations to execute
 * @returns Promise that resolves to the operations array (for chaining)
 */
export async function executeFileOperations(
  operations: FileOperation[],
): Promise<FileOperation[]> {
  for (const operation of operations) {
    await writeFileAtomic(operation.filePath, operation.content);
  }
  return operations;
}
