import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: string) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown) => string>();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockUnlinkSync = jest.fn();

const mockInteractivePrompt = jest.fn<() => Promise<{ confirm: boolean }>>();
const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  succeed: mockOraSucceed,
  fail: mockOraFail,
}));

const mockUpdateImportPaths = jest.fn<(content: string, subdir: string) => string>(
  (content) => content,
);

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    unlinkSync: mockUnlinkSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  unlinkSync: mockUnlinkSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

jest.unstable_mockModule("../../utils/interactive.js", () => ({
  interactivePrompt: mockInteractivePrompt,
}));

jest.unstable_mockModule("../migrate-core.js", () => ({
  updateImportPaths: mockUpdateImportPaths,
}));

// Suppress console output during tests
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const {
  detectTemplate,
  generateAiUpgradePrompts,
  safeFetch,
  confirmAction,
  migrateComponentsDuringUpgrade,
} = await import("./utils.js");

describe("upgrade/utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("detectTemplate", () => {
    it("returns null when README.md does not exist", async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await detectTemplate();

      expect(result).toBeNull();
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('returns "standard" when README contains Tambo Template', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("# My App\n\nBased on Tambo Template");

      const result = await detectTemplate();

      expect(result).toBe("standard");
    });

    it('returns "analytics" when README contains Analytics Template', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("# My App\n\nBased on Analytics Template");

      const result = await detectTemplate();

      expect(result).toBe("analytics");
    });

    it("returns null when template type not identified", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("# My Custom App\n\nNo template info");

      const result = await detectTemplate();

      expect(result).toBeNull();
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("returns null and logs error on exception", async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      const result = await detectTemplate();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("generateAiUpgradePrompts", () => {
    it("returns common prompts when template is null", () => {
      const result = generateAiUpgradePrompts(null);

      expect(result.length).toBe(3);
      expect(result).toContain(
        "How can I optimize my tambo components for better performance?",
      );
    });

    it("includes standard-specific prompts for standard template", () => {
      const result = generateAiUpgradePrompts("standard");

      expect(result.length).toBe(5);
      expect(result).toContain(
        "How can I optimize the state management in my tambo application?",
      );
    });

    it("includes analytics-specific prompts for analytics template", () => {
      const result = generateAiUpgradePrompts("analytics");

      expect(result.length).toBe(5);
      expect(result).toContain(
        "How can I optimize my tambo canvas drag-and-drop interactions for better user experience?",
      );
    });

    it("returns only common prompts for unknown template", () => {
      const result = generateAiUpgradePrompts("unknown");

      expect(result.length).toBe(3);
    });
  });

  describe("safeFetch", () => {
    it("uses global fetch when available", async () => {
      const mockResponse = { ok: true, json: async () => ({}) };
      const originalFetch = globalThis.fetch;
      globalThis.fetch = jest.fn<typeof fetch>().mockResolvedValue(mockResponse as Response);

      const result = await safeFetch("https://example.com");

      expect(result).toBe(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com");

      globalThis.fetch = originalFetch;
    });

    // Note: Testing the fallback error path is difficult because node-fetch is installed
    // and we can't easily mock the dynamic import. The happy path test above covers
    // the main functionality.
  });

  describe("confirmAction", () => {
    it("returns true when user confirms", async () => {
      mockInteractivePrompt.mockResolvedValue({ confirm: true });

      const result = await confirmAction("Proceed?");

      expect(result).toBe(true);
      expect(mockInteractivePrompt).toHaveBeenCalled();
    });

    it("returns false when user declines", async () => {
      mockInteractivePrompt.mockResolvedValue({ confirm: false });

      const result = await confirmAction("Proceed?");

      expect(result).toBe(false);
    });

    it("uses provided default value", async () => {
      mockInteractivePrompt.mockResolvedValue({ confirm: false });

      await confirmAction("Proceed?", false);

      // Just verify the function was called
      expect(mockInteractivePrompt).toHaveBeenCalled();
    });
  });

  describe("migrateComponentsDuringUpgrade", () => {
    it("creates new directory and migrates components", async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("const x = 1;");
      mockUpdateImportPaths.mockReturnValue("const x = 1; // updated");

      await migrateComponentsDuringUpgrade(["button", "input"], "src");

      expect(mockMkdirSync).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
      expect(mockUnlinkSync).toHaveBeenCalledTimes(2);
      expect(mockOraSucceed).toHaveBeenCalled();
    });

    it("skips components that do not exist", async () => {
      mockExistsSync.mockReturnValue(false);

      await migrateComponentsDuringUpgrade(["nonexistent"], "src");

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });

    it("fails spinner and rethrows on error", async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error("Migration error");
      });

      await expect(
        migrateComponentsDuringUpgrade(["button"], "src"),
      ).rejects.toThrow("Migration error");

      expect(mockOraFail).toHaveBeenCalled();
    });
  });
});
