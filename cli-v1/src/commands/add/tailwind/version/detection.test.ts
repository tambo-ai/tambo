import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

// Suppress console output
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

const { detectTailwindVersion, isV4OrLater } = await import("./detection.js");

describe("tailwind/version/detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe("detectTailwindVersion", () => {
    it("returns null when package.json does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      const result = detectTailwindVersion("/project");

      expect(result).toBeNull();
    });

    it("returns null when tailwindcss is not in dependencies", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { react: "^18.0.0" },
        devDependencies: {},
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBeNull();
    });

    it("returns version from dependencies", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { tailwindcss: "^3.4.0" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("3.4.0");
    });

    it("returns version from devDependencies", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        devDependencies: { tailwindcss: "^4.0.0" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("4.0.0");
    });

    it("handles version with caret (^)", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { tailwindcss: "^3.3.2" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("3.3.2");
    });

    it("handles version with tilde (~)", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { tailwindcss: "~3.3.0" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("3.3.0");
    });

    it("handles exact version", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { tailwindcss: "4.0.0" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("4.0.0");
    });

    it("returns null on JSON parse error", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid json");

      const result = detectTailwindVersion("/project");

      expect(result).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it("handles version with prerelease tags", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        dependencies: { tailwindcss: "4.0.0-beta.1" },
      }));

      const result = detectTailwindVersion("/project");

      expect(result).toBe("4.0.0-beta.1");
    });
  });

  describe("isV4OrLater", () => {
    it("returns false for null version", () => {
      expect(isV4OrLater(null)).toBe(false);
    });

    it("returns false for v3.x", () => {
      expect(isV4OrLater("3.4.0")).toBe(false);
    });

    it("returns false for v3.99.99", () => {
      expect(isV4OrLater("3.99.99")).toBe(false);
    });

    it("returns true for v4.0.0", () => {
      expect(isV4OrLater("4.0.0")).toBe(true);
    });

    it("returns true for v4.1.0", () => {
      expect(isV4OrLater("4.1.0")).toBe(true);
    });

    it("returns true for v5.0.0", () => {
      expect(isV4OrLater("5.0.0")).toBe(true);
    });
  });
});
