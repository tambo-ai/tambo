/**
 * Tests for diff generation utilities
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateFileDiff } from "./diff-generator.js";

describe("generateFileDiff", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "diff-generator-test-"));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should produce a patch containing + and - lines for modified file", async () => {
    // Arrange: Create a temp file with original content
    const filePath = path.join(tempDir, "test-file.ts");
    const oldContent = "const x = 1;\nconst y = 2;\n";
    const newContent = "const x = 1;\nconst y = 3;\nconst z = 4;\n";

    await fs.writeFile(filePath, oldContent, "utf-8");

    // Act: Generate diff
    const result = await generateFileDiff(filePath, newContent);

    // Assert: Check structure and patch content
    expect(result.filePath).toBe(filePath);
    expect(result.isNew).toBe(false);
    expect(result.oldContent).toBe(oldContent);
    expect(result.newContent).toBe(newContent);
    expect(result.patch).toContain("-const y = 2;");
    expect(result.patch).toContain("+const y = 3;");
    expect(result.patch).toContain("+const z = 4;");
  });

  it("should return isNew=true and empty patch for new file (ENOENT)", async () => {
    // Arrange: Use a path that doesn't exist
    const filePath = path.join(tempDir, "non-existent-file.ts");
    const newContent = "const x = 1;\n";

    // Act: Generate diff
    const result = await generateFileDiff(filePath, newContent);

    // Assert: Check isNew flag and empty patch
    expect(result.filePath).toBe(filePath);
    expect(result.isNew).toBe(true);
    expect(result.oldContent).toBe("");
    expect(result.newContent).toBe(newContent);
    expect(result.patch).toBe("");
  });

  it("should re-throw non-ENOENT errors", async () => {
    // Arrange: Use a path that will cause a permission error
    // Create a directory with the target file name to cause EISDIR error
    const filePath = path.join(tempDir, "directory-not-file");
    await fs.mkdir(filePath);

    const newContent = "const x = 1;\n";

    // Act & Assert: Should throw non-ENOENT error
    await expect(generateFileDiff(filePath, newContent)).rejects.toThrow();
  });
});
