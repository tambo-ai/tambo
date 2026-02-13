/**
 * Tests for diff display formatting utilities
 */

import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import chalk from "chalk";
import {
  displayFileDiff,
  displayNewFileMessage,
  formatDiffForDisplay,
} from "./diff-display.js";
import type { FileDiff } from "./types.js";

describe("formatDiffForDisplay", () => {
  beforeAll(() => {
    // Force color output in tests
    chalk.level = 1;
  });

  it("should colorize additions with green", () => {
    const patch = `
@@ -1,2 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
+const z = 4;
`;

    const result = formatDiffForDisplay(patch);

    // Check for ANSI escape codes (green for additions)
    expect(result).toContain("\x1b[32m"); // Green color code
    expect(result).toContain("+const y = 3;");
    expect(result).toContain("+const z = 4;");
  });

  it("should colorize deletions with red", () => {
    const patch = `
@@ -1,2 +1,1 @@
 const x = 1;
-const y = 2;
`;

    const result = formatDiffForDisplay(patch);

    // Check for ANSI escape codes (red for deletions)
    expect(result).toContain("\x1b[31m"); // Red color code
    expect(result).toContain("-const y = 2;");
  });

  it("should colorize hunk headers with cyan", () => {
    const patch = `
@@ -1,2 +1,3 @@
 const x = 1;
+const y = 2;
`;

    const result = formatDiffForDisplay(patch);

    // Check for ANSI escape codes (cyan for hunk headers)
    expect(result).toContain("\x1b[36m"); // Cyan color code
    expect(result).toContain("@@");
  });

  it("should colorize context lines with dim", () => {
    const patch = `
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
`;

    const result = formatDiffForDisplay(patch);

    // Context lines should be dimmed
    expect(result).toContain("\x1b[2m"); // Dim color code
  });

  it("should colorize file headers with bold", () => {
    const patch = `
Index: test.ts
===================================================================
--- test.ts
+++ test.ts
@@ -1,2 +1,2 @@
 const x = 1;
-const y = 2;
+const y = 3;
`;

    const result = formatDiffForDisplay(patch);

    // File headers should be bold
    expect(result).toContain("\x1b[1m"); // Bold color code
  });
});

describe("displayNewFileMessage", () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {}) as jest.SpiedFunction<typeof console.log>;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should display new file creation message", () => {
    const filePath = "/path/to/new-file.ts";
    const lineCount = 42;

    displayNewFileMessage(filePath, lineCount);

    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Will create"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(filePath),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("42 lines"),
    );
  });
});

describe("displayFileDiff", () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {}) as jest.SpiedFunction<typeof console.log>;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should display file path and formatted diff", () => {
    const diff: FileDiff = {
      filePath: "/path/to/file.ts",
      isNew: false,
      oldContent: "const x = 1;\n",
      newContent: "const x = 2;\n",
      patch: `
@@ -1,1 +1,1 @@
-const x = 1;
+const x = 2;
`,
    };

    displayFileDiff(diff);

    // Verify console.log was called with file path
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(diff.filePath),
    );

    // Verify formatted diff was printed
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("-const x = 1;"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("+const x = 2;"),
    );
  });
});
