/**
 * Tests for atomic file operations
 *
 * Uses real filesystem (os.tmpdir()) to test actual fs behavior.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  writeFileAtomic,
  createBackup,
  restoreBackups,
  cleanupBackups,
  executeFileOperations,
} from "./file-operations.js";
import type { BackupManifest, FileOperation } from "./types.js";

describe("file-operations", () => {
  let testDir: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testDir = path.join(os.tmpdir(), `tambo-test-${crypto.randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("writeFileAtomic", () => {
    it("should write a new file atomically", async () => {
      const filePath = path.join(testDir, "new-file.txt");
      const content = "hello world";

      await writeFileAtomic(filePath, content);

      const result = await fs.readFile(filePath, "utf-8");
      expect(result).toBe(content);
    });

    it("should overwrite an existing file atomically", async () => {
      const filePath = path.join(testDir, "existing.txt");
      await fs.writeFile(filePath, "old content");

      const newContent = "new content";
      await writeFileAtomic(filePath, newContent);

      const result = await fs.readFile(filePath, "utf-8");
      expect(result).toBe(newContent);
    });

    it("should create parent directories if they don't exist", async () => {
      const filePath = path.join(testDir, "nested", "deep", "file.txt");
      const content = "nested content";

      await writeFileAtomic(filePath, content);

      const result = await fs.readFile(filePath, "utf-8");
      expect(result).toBe(content);
    });

    it("should clean up temp file on error", async () => {
      // Create a read-only directory to force rename to fail
      const readOnlyDir = path.join(testDir, "readonly");
      await fs.mkdir(readOnlyDir);
      const filePath = path.join(readOnlyDir, "file.txt");

      // Make directory read-only (no write permissions)
      await fs.chmod(readOnlyDir, 0o444);

      try {
        await expect(writeFileAtomic(filePath, "content")).rejects.toThrow();

        // Check that no temp files are left behind in parent testDir
        // (Can't check readOnlyDir because we can't read it now)
        const files = await fs.readdir(testDir);
        const tempFiles = files.filter((f) => f.includes(".tmp"));
        expect(tempFiles).toHaveLength(0);
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(readOnlyDir, 0o755);
      }
    });
  });

  describe("createBackup", () => {
    it("should back up an existing file", async () => {
      const filePath = path.join(testDir, "original.txt");
      const originalContent = "original content";
      await fs.writeFile(filePath, originalContent);

      const manifest: BackupManifest = {
        backups: new Map(),
        timestamp: "20260216",
      };

      await createBackup(filePath, manifest);

      // Check backup was recorded
      expect(manifest.backups.has(filePath)).toBe(true);
      const backupPath = manifest.backups.get(filePath)!;

      // Check backup file exists with correct content
      const backupContent = await fs.readFile(backupPath, "utf-8");
      expect(backupContent).toBe(originalContent);
    });

    it("should skip backing up a non-existent file", async () => {
      const filePath = path.join(testDir, "nonexistent.txt");
      const manifest: BackupManifest = {
        backups: new Map(),
        timestamp: "20260216",
      };

      await createBackup(filePath, manifest);

      // Should not add anything to manifest
      expect(manifest.backups.has(filePath)).toBe(false);
    });

    it("should record backup path in manifest", async () => {
      const filePath = path.join(testDir, "file.txt");
      await fs.writeFile(filePath, "content");

      const manifest: BackupManifest = {
        backups: new Map(),
        timestamp: "test123",
      };

      await createBackup(filePath, manifest);

      expect(manifest.backups.get(filePath)).toContain(".backup.test123");
    });
  });

  describe("restoreBackups", () => {
    it("should restore backed-up files to original locations", async () => {
      const filePath = path.join(testDir, "file.txt");
      const originalContent = "original";
      const modifiedContent = "modified";

      // Create original and backup
      await fs.writeFile(filePath, originalContent);
      const backupPath = path.join(testDir, ".file.txt.backup.test");
      await fs.writeFile(backupPath, originalContent);

      // Modify original
      await fs.writeFile(filePath, modifiedContent);

      const manifest: BackupManifest = {
        backups: new Map([[filePath, backupPath]]),
        timestamp: "test",
      };

      await restoreBackups(manifest);

      // Check original was restored
      const restoredContent = await fs.readFile(filePath, "utf-8");
      expect(restoredContent).toBe(originalContent);
    });

    it("should handle missing backup files gracefully", async () => {
      const filePath = path.join(testDir, "file.txt");
      const backupPath = path.join(testDir, "nonexistent-backup.txt");

      const manifest: BackupManifest = {
        backups: new Map([[filePath, backupPath]]),
        timestamp: "test",
      };

      // Should not throw
      await expect(restoreBackups(manifest)).resolves.not.toThrow();
    });
  });

  describe("cleanupBackups", () => {
    it("should remove backup files", async () => {
      const backupPath = path.join(testDir, ".file.txt.backup.test");
      await fs.writeFile(backupPath, "backup content");

      const manifest: BackupManifest = {
        backups: new Map([[path.join(testDir, "file.txt"), backupPath]]),
        timestamp: "test",
      };

      await cleanupBackups(manifest);

      // Check backup was deleted
      await expect(fs.access(backupPath)).rejects.toThrow();
    });

    it("should ignore errors when deleting backups", async () => {
      const backupPath = path.join(testDir, "nonexistent-backup.txt");

      const manifest: BackupManifest = {
        backups: new Map([[path.join(testDir, "file.txt"), backupPath]]),
        timestamp: "test",
      };

      // Should not throw even though file doesn't exist
      await expect(cleanupBackups(manifest)).resolves.not.toThrow();
    });
  });

  describe("executeFileOperations", () => {
    it("should write multiple files sequentially", async () => {
      const operations: FileOperation[] = [
        {
          filePath: path.join(testDir, "file1.txt"),
          content: "content 1",
          isNew: true,
        },
        {
          filePath: path.join(testDir, "file2.txt"),
          content: "content 2",
          isNew: true,
        },
      ];

      const result = await executeFileOperations(operations);

      expect(result).toEqual(operations);

      const content1 = await fs.readFile(operations[0].filePath, "utf-8");
      const content2 = await fs.readFile(operations[1].filePath, "utf-8");
      expect(content1).toBe("content 1");
      expect(content2).toBe("content 2");
    });

    it("should stop on first error", async () => {
      const operations: FileOperation[] = [
        {
          filePath: path.join(testDir, "file1.txt"),
          content: "content 1",
          isNew: true,
        },
        {
          filePath: "/invalid/path/that/does/not/exist/file2.txt",
          content: "content 2",
          isNew: true,
        },
        {
          filePath: path.join(testDir, "file3.txt"),
          content: "content 3",
          isNew: true,
        },
      ];

      await expect(executeFileOperations(operations)).rejects.toThrow();

      // First file should exist
      await expect(fs.access(operations[0].filePath)).resolves.not.toThrow();

      // Third file should NOT exist (stopped before reaching it)
      await expect(fs.access(operations[2].filePath)).rejects.toThrow();
    });
  });
});
