/**
 * Tests for verification module
 *
 * These tests use real temp files to verify actual filesystem behavior.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { verifyExecution } from "./verification.js";
import type { FileOperation } from "./types.js";

describe("verifyExecution", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for this test
    tempDir = path.join(
      os.tmpdir(),
      `tambo-verify-test-${crypto.randomUUID()}`,
    );
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test("returns empty array for valid files", async () => {
    const filePath = path.join(tempDir, "valid.ts");
    const content = `import { foo } from "bar";

export function hello() {
  return "world";
}
`;
    await fs.writeFile(filePath, content, "utf-8");

    const operations: FileOperation[] = [{ filePath, content, isNew: true }];

    const errors = await verifyExecution(operations);

    expect(errors).toEqual([]);
  });

  test("detects missing file", async () => {
    const filePath = path.join(tempDir, "missing.ts");

    const operations: FileOperation[] = [
      { filePath, content: "test", isNew: true },
    ];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      filePath,
      issue: "File was not created",
      suggestion: "Check file write permissions and disk space",
    });
  });

  test("detects empty file", async () => {
    const filePath = path.join(tempDir, "empty.ts");
    await fs.writeFile(filePath, "", "utf-8");

    const operations: FileOperation[] = [
      { filePath, content: "", isNew: true },
    ];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      filePath,
      issue: "File is empty",
      suggestion: "Content generation may have failed",
    });
  });

  test("detects unbalanced braces in .ts file", async () => {
    const filePath = path.join(tempDir, "unbalanced.ts");
    const content = `export function test() {
  if (true) {
    console.log("missing closing brace");
  }
`;
    await fs.writeFile(filePath, content, "utf-8");

    const operations: FileOperation[] = [{ filePath, content, isNew: true }];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      filePath,
      issue: expect.stringContaining("Unbalanced braces"),
      suggestion: "Check file syntax with: npx tsc --noEmit",
    });
  });

  test("detects missing imports in .tsx file", async () => {
    const filePath = path.join(tempDir, "component.tsx");
    const content = `export function Component() {
  return <div>Hello</div>;
}
`;
    await fs.writeFile(filePath, content, "utf-8");

    const operations: FileOperation[] = [{ filePath, content, isNew: true }];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      filePath,
      issue: "React component missing imports",
      suggestion: "Add necessary import statements (e.g., React, types)",
    });
  });

  test("detects missing exports", async () => {
    const filePath = path.join(tempDir, "no-export.ts");
    const content = `function helper() {
  return "private";
}
`;
    await fs.writeFile(filePath, content, "utf-8");

    const operations: FileOperation[] = [{ filePath, content, isNew: true }];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      filePath,
      issue: "File has no exports",
      suggestion: "Add export statement to make code accessible",
    });
  });

  test("skips syntax checks for non-TS files", async () => {
    const jsonPath = path.join(tempDir, "config.json");
    const jsonContent = '{"key": "value"}';
    await fs.writeFile(jsonPath, jsonContent, "utf-8");

    const cssPath = path.join(tempDir, "styles.css");
    const cssContent = ".class { color: red; }";
    await fs.writeFile(cssPath, cssContent, "utf-8");

    const operations: FileOperation[] = [
      { filePath: jsonPath, content: jsonContent, isNew: true },
      { filePath: cssPath, content: cssContent, isNew: true },
    ];

    const errors = await verifyExecution(operations);

    // Should not have any syntax warnings for non-TS files
    expect(errors).toEqual([]);
  });

  test("handles file permission errors gracefully", async () => {
    const filePath = path.join(tempDir, "readonly.ts");
    const content = "export const test = 1;";
    await fs.writeFile(filePath, content, "utf-8");

    // Make file unreadable (chmod 000)
    await fs.chmod(filePath, 0o000);

    const operations: FileOperation[] = [{ filePath, content, isNew: true }];

    const errors = await verifyExecution(operations);

    // Should detect file is not readable
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      filePath,
      issue: "File exists but is not readable",
      suggestion: "Check file permissions",
    });

    // Cleanup: restore permissions so afterEach can clean up
    await fs.chmod(filePath, 0o644);
  });

  test("checks multiple files and accumulates errors", async () => {
    const file1 = path.join(tempDir, "missing.ts");
    const file2 = path.join(tempDir, "empty.ts");
    await fs.writeFile(file2, "", "utf-8");

    const operations: FileOperation[] = [
      { filePath: file1, content: "test", isNew: true },
      { filePath: file2, content: "", isNew: true },
    ];

    const errors = await verifyExecution(operations);

    expect(errors).toHaveLength(2);
    expect(errors[0].issue).toBe("File was not created");
    expect(errors[1].issue).toBe("File is empty");
  });
});
