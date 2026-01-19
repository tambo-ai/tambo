import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();
const mockReadFileSync = jest.fn<(p: unknown, encoding?: unknown) => string>();

const mockGetConfigPath = jest.fn<(name: string) => string>();
const mockConfirmAction = jest.fn<() => Promise<boolean>>();
const mockMigrateComponentsDuringUpgrade = jest.fn<(components: string[], installPath: string) => Promise<void>>();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

jest.unstable_mockModule("../add/utils.js", () => ({
  getConfigPath: mockGetConfigPath,
}));

jest.unstable_mockModule("../upgrade/utils.js", () => ({
  confirmAction: mockConfirmAction,
  migrateComponentsDuringUpgrade: mockMigrateComponentsDuringUpgrade,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

const {
  findComponentLocation,
  detectCrossLocationDependencies,
  handleDependencyInconsistencies,
} = await import("./component-utils.js");

describe("component-utils", () => {
  const projectRoot = "/project";

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("findComponentLocation", () => {
    it("returns null when component not found with explicit prefix", () => {
      mockExistsSync.mockReturnValue(false);

      const result = findComponentLocation("button", projectRoot, "src/custom", true);

      expect(result).toBeNull();
    });

    it("returns location when component found with explicit prefix", () => {
      mockExistsSync.mockReturnValue(true);

      const result = findComponentLocation("button", projectRoot, "src/custom", true);

      expect(result).not.toBeNull();
      expect(result?.componentPath).toContain("button.tsx");
      expect(result?.installPath).toBe("src/custom");
    });

    it("returns new location when component found in tambo/", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        return pathStr.includes("tambo");
      });

      const result = findComponentLocation("button", projectRoot, "src", false);

      expect(result).not.toBeNull();
      expect(result?.componentPath).toContain("tambo");
      expect(result?.needsCreation).toBeUndefined();
    });

    it("returns legacy location with needsCreation flag", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        // Not in tambo, but in ui
        return pathStr.includes("/ui/");
      });

      const result = findComponentLocation("button", projectRoot, "src", false);

      expect(result).not.toBeNull();
      expect(result?.needsCreation).toBe(true);
    });

    it("returns null when component not found in either location", () => {
      mockExistsSync.mockReturnValue(false);

      const result = findComponentLocation("missing", projectRoot, "src", false);

      expect(result).toBeNull();
    });

    it("throws on error", () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      expect(() =>
        findComponentLocation("error", projectRoot, "src", false),
      ).toThrow("Failed to locate component error");
    });
  });

  describe("detectCrossLocationDependencies", () => {
    it("returns empty array when no components", async () => {
      const result = await detectCrossLocationDependencies([], "src", false);

      expect(result).toEqual([]);
    });

    it("returns empty array when no config found", async () => {
      mockGetConfigPath.mockReturnValue("/path/to/config.json");
      mockExistsSync.mockReturnValue(false);

      const result = await detectCrossLocationDependencies(
        [{ name: "button", installPath: "src" }],
        "src",
        false,
      );

      expect(result).toEqual([]);
    });

    it("detects dependency inconsistency when main in ui and dep in tambo", async () => {
      mockGetConfigPath.mockReturnValue("/path/to/button/config.json");
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        // Config exists
        if (pathStr.includes("config.json")) return true;
        // Button is in ui (legacy)
        if (pathStr.includes("button") && pathStr.includes("/ui/")) return true;
        // Input is in tambo (new)
        if (pathStr.includes("input") && pathStr.includes("/tambo/")) return true;
        return false;
      });
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ requires: ["input"] }),
      );

      const result = await detectCrossLocationDependencies(
        [{ name: "button", installPath: "src" }],
        "src",
        false,
      );

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        main: "button",
        mainLocation: "ui",
        dependency: "input",
        depLocation: "tambo",
      });
    });

    it("handles support files", async () => {
      mockGetConfigPath.mockReturnValue("/path/to/card/config.json");
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr.includes("config.json")) return true;
        // Card is in tambo
        if (pathStr.includes("card") && pathStr.includes("/tambo/")) return true;
        // Helper is in ui (legacy)
        if (pathStr.includes("helper") && pathStr.includes("/ui/")) return true;
        return false;
      });
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          files: [{ name: "helper.tsx" }],
        }),
      );

      const result = await detectCrossLocationDependencies(
        [{ name: "card", installPath: "src" }],
        "src",
        false,
      );

      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        main: "card",
        mainLocation: "tambo",
        dependency: "helper",
        depLocation: "ui",
      });
    });

    it("removes duplicate inconsistencies", async () => {
      mockGetConfigPath.mockReturnValue("/path/to/config.json");
      mockExistsSync.mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr.includes("config.json")) return true;
        if (pathStr.includes("/ui/")) return true;
        if (pathStr.includes("/tambo/") && pathStr.includes("dep")) return true;
        return false;
      });
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          requires: ["dep", "dep"], // Duplicate deps
        }),
      );

      const result = await detectCrossLocationDependencies(
        [{ name: "main", installPath: "src" }],
        "src",
        false,
      );

      // Should be deduplicated
      expect(
        result.filter((i) => i.main === "main" && i.dependency === "dep").length,
      ).toBeLessThanOrEqual(1);
    });

    it("continues on error for individual components", async () => {
      mockGetConfigPath.mockReturnValue("/path/to/config.json");
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "error-component", installPath: "src" }],
        "src",
        false,
      );

      expect(result).toEqual([]);
    });
  });

  describe("handleDependencyInconsistencies", () => {
    it("returns false when no inconsistencies", async () => {
      const result = await handleDependencyInconsistencies([], [], "src");

      expect(result).toBe(false);
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("displays inconsistencies and prompts for migration", async () => {
      mockConfirmAction.mockResolvedValue(false);

      const inconsistencies = [
        {
          main: "card",
          mainLocation: "ui" as const,
          dependency: "button",
          depLocation: "tambo" as const,
        },
      ];

      await handleDependencyInconsistencies(inconsistencies, ["card"], "src");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Mixed component locations"),
      );
      expect(mockConfirmAction).toHaveBeenCalled();
    });

    it("performs migration when user confirms", async () => {
      mockConfirmAction.mockResolvedValue(true);
      mockMigrateComponentsDuringUpgrade.mockResolvedValue(undefined);

      const inconsistencies = [
        {
          main: "card",
          mainLocation: "ui" as const,
          dependency: "button",
          depLocation: "tambo" as const,
        },
      ];

      const result = await handleDependencyInconsistencies(
        inconsistencies,
        ["card"],
        "src",
      );

      expect(result).toBe(true);
      expect(mockMigrateComponentsDuringUpgrade).toHaveBeenCalledWith(["card"], "src");
    });

    it("warns about mixed locations when user declines migration", async () => {
      mockConfirmAction.mockResolvedValue(false);

      const inconsistencies = [
        {
          main: "card",
          mainLocation: "ui" as const,
          dependency: "button",
          depLocation: "tambo" as const,
        },
      ];

      const result = await handleDependencyInconsistencies(
        inconsistencies,
        ["card"],
        "src",
        "upgrade",
      );

      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Proceeding with mixed locations"),
      );
    });
  });
});
