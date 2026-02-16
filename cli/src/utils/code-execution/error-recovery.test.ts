/**
 * Tests for error recovery and formatting
 *
 * These tests verify error categorization and formatting for actionable output.
 */

import {
  categorizeExecutionError,
  formatExecutionError,
} from "./error-recovery.js";

describe("categorizeExecutionError", () => {
  test("categorizes EACCES as permission error", () => {
    const error = new Error("Permission denied") as NodeJS.ErrnoException;
    error.code = "EACCES";

    const result = categorizeExecutionError(error, "/path/to/file.ts");

    expect(result).toEqual({
      phase: "file-write",
      filePath: "/path/to/file.ts",
      cause: "Permission denied",
      suggestions: [
        "Check file and directory permissions",
        "Run: chmod u+w /path/to/file.ts",
        "Check if file is locked by another process",
      ],
    });
  });

  test("categorizes ENOSPC as disk space error", () => {
    const error = new Error("No space left on device") as NodeJS.ErrnoException;
    error.code = "ENOSPC";

    const result = categorizeExecutionError(error);

    expect(result).toEqual({
      phase: "file-write",
      cause: "No space left on device",
      suggestions: [
        "Free up disk space",
        "Check available space with: df -h",
        "Remove temporary files or unused dependencies",
      ],
    });
  });

  test("categorizes ENOENT as missing directory error", () => {
    const error = new Error(
      "No such file or directory",
    ) as NodeJS.ErrnoException;
    error.code = "ENOENT";

    const result = categorizeExecutionError(error, "/path/to/new/file.ts");

    expect(result).toEqual({
      phase: "file-write",
      filePath: "/path/to/new/file.ts",
      cause: "No such file or directory",
      suggestions: [
        "Parent directory does not exist",
        "Check directory path: /path/to/new",
        "Verify project structure is intact",
      ],
    });
  });

  test("categorizes dependency errors by message", () => {
    const error = new Error("Failed to install dependency: package not found");

    const result = categorizeExecutionError(error);

    expect(result).toEqual({
      phase: "dependency-install",
      cause: "Failed to install dependency: package not found",
      suggestions: [
        "Check network connection",
        "Verify package name and version",
        "Try clearing package manager cache",
        "Check registry configuration",
      ],
    });
  });

  test("categorizes install errors by message", () => {
    const error = new Error("npm install failed with code 1");

    const result = categorizeExecutionError(error);

    expect(result).toEqual({
      phase: "dependency-install",
      cause: "npm install failed with code 1",
      suggestions: [
        "Check network connection",
        "Verify package name and version",
        "Try clearing package manager cache",
        "Check registry configuration",
      ],
    });
  });

  test("provides generic suggestions for unknown errors", () => {
    const error = new Error("Something went wrong");

    const result = categorizeExecutionError(error, "/path/to/file.ts");

    expect(result).toEqual({
      phase: "file-write",
      filePath: "/path/to/file.ts",
      cause: "Something went wrong",
      suggestions: [
        "Check error message for details",
        "Verify file path and permissions",
        "Try running the command again",
      ],
    });
  });

  test("handles errors without file paths", () => {
    const error = new Error("General error");

    const result = categorizeExecutionError(error);

    expect(result).toMatchObject({
      phase: "file-write",
      cause: "General error",
      suggestions: expect.any(Array),
    });
    expect(result.filePath).toBeUndefined();
  });
});

describe("formatExecutionError", () => {
  test("formats error with all fields", () => {
    const error = {
      phase: "file-write" as const,
      filePath: "/path/to/file.ts",
      cause: "Permission denied",
      suggestions: [
        "Check file permissions",
        "Run: chmod u+w /path/to/file.ts",
      ],
    };

    const formatted = formatExecutionError(error);

    // Check that formatted output contains key information
    expect(formatted).toContain("Execution failed during file-write");
    expect(formatted).toContain("/path/to/file.ts");
    expect(formatted).toContain("Permission denied");
    expect(formatted).toContain("1. Check file permissions");
    expect(formatted).toContain("2. Run: chmod u+w /path/to/file.ts");
  });

  test("formats error without file path", () => {
    const error = {
      phase: "dependency-install" as const,
      cause: "Network timeout",
      suggestions: ["Check network connection", "Try again"],
    };

    const formatted = formatExecutionError(error);

    expect(formatted).toContain("Execution failed during dependency-install");
    expect(formatted).toContain("Network timeout");
    expect(formatted).toContain("1. Check network connection");
    expect(formatted).toContain("2. Try again");
    expect(formatted).not.toContain("File:");
  });

  test("formats verification phase error", () => {
    const error = {
      phase: "verification" as const,
      filePath: "/path/to/component.tsx",
      cause: "Missing imports",
      suggestions: ["Add React import", "Check import statements"],
    };

    const formatted = formatExecutionError(error);

    expect(formatted).toContain("Execution failed during verification");
    expect(formatted).toContain("/path/to/component.tsx");
    expect(formatted).toContain("Missing imports");
  });

  test("handles empty suggestions array", () => {
    const error = {
      phase: "file-write" as const,
      cause: "Unknown error",
      suggestions: [],
    };

    const formatted = formatExecutionError(error);

    expect(formatted).toContain("Execution failed during file-write");
    expect(formatted).toContain("Unknown error");
  });

  test("numbers suggestions correctly", () => {
    const error = {
      phase: "file-write" as const,
      cause: "Error",
      suggestions: ["First", "Second", "Third", "Fourth"],
    };

    const formatted = formatExecutionError(error);

    expect(formatted).toContain("1. First");
    expect(formatted).toContain("2. Second");
    expect(formatted).toContain("3. Third");
    expect(formatted).toContain("4. Fourth");
  });
});
