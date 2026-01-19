import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";

const mockExistsSync = jest.fn<(p: unknown) => boolean>();

const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOraInfo = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  succeed: mockOraSucceed,
  fail: mockOraFail,
  info: mockOraInfo,
}));

const mockInteractivePrompt = jest.fn<() => Promise<{ selectedComponents: string[] }>>();
const mockGetInstallationPath = jest.fn<() => Promise<string>>();
const mockGetInstalledComponents = jest.fn<() => Promise<string[]>>();
const mockInstallComponents = jest.fn<(components: string[], options: unknown) => Promise<void>>();
const mockSetupTailwindAndGlobals = jest.fn<() => Promise<void>>();
const mockConfirmAction = jest.fn<() => Promise<boolean>>();
const mockMigrateComponentsDuringUpgrade = jest.fn<() => Promise<void>>();
const mockFindComponentLocation = jest.fn<(name: string, root: string, path: string, explicit: boolean) => { componentPath: string; installPath: string; needsCreation?: boolean } | null>();
const mockDetectCrossLocationDependencies = jest.fn<() => Promise<Array<{
  main: string;
  mainLocation: "ui" | "tambo";
  dependency: string;
  depLocation: "ui" | "tambo";
}>>>();
const mockHandleDependencyInconsistencies = jest.fn<() => Promise<boolean>>();
const mockResolveDependenciesForComponents = jest.fn<(components: unknown, installed: Set<string>) => Promise<{ existingDependencies: string[]; newDependencies: string[] }>>();
const mockDisplayDependencyInfo = jest.fn();
const mockExpandComponentsWithDependencies = jest.fn();

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: mockExistsSync,
  },
  existsSync: mockExistsSync,
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

jest.unstable_mockModule("../../utils/interactive.js", () => ({
  interactivePrompt: mockInteractivePrompt,
}));

jest.unstable_mockModule("../init.js", () => ({
  getInstallationPath: mockGetInstallationPath,
}));

jest.unstable_mockModule("../add/utils.js", () => ({
  getInstalledComponents: mockGetInstalledComponents,
}));

jest.unstable_mockModule("../add/component.js", () => ({
  installComponents: mockInstallComponents,
}));

jest.unstable_mockModule("../add/tailwind-setup.js", () => ({
  setupTailwindAndGlobals: mockSetupTailwindAndGlobals,
}));

jest.unstable_mockModule("./utils.js", () => ({
  confirmAction: mockConfirmAction,
  migrateComponentsDuringUpgrade: mockMigrateComponentsDuringUpgrade,
}));

jest.unstable_mockModule("../shared/component-utils.js", () => ({
  findComponentLocation: mockFindComponentLocation,
  detectCrossLocationDependencies: mockDetectCrossLocationDependencies,
  handleDependencyInconsistencies: mockHandleDependencyInconsistencies,
}));

jest.unstable_mockModule("../../utils/dependency-resolution.js", () => ({
  resolveDependenciesForComponents: mockResolveDependenciesForComponents,
  displayDependencyInfo: mockDisplayDependencyInfo,
  expandComponentsWithDependencies: mockExpandComponentsWithDependencies,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const { upgradeComponents } = await import("./components.js");

describe("upgrade/components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    mockGetInstallationPath.mockResolvedValue("src");
    mockGetInstalledComponents.mockResolvedValue([]);
    mockResolveDependenciesForComponents.mockResolvedValue({
      existingDependencies: [],
      newDependencies: [],
    });
    mockExpandComponentsWithDependencies.mockImplementation((components) => components);
    mockDetectCrossLocationDependencies.mockResolvedValue([]);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("upgradeComponents", () => {
    it("returns true when no components directory exists", async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true);
      expect(mockOraInfo).toHaveBeenCalledWith(
        expect.stringContaining("No tambo components directory"),
      );
    });

    it("returns true when no components are installed", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue([]);

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true);
      expect(mockOraSucceed).toHaveBeenCalledWith(
        expect.stringContaining("Found 0"),
      );
    });

    it("upgrades components when found", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
      });
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true);
      expect(mockInstallComponents).toHaveBeenCalledWith(
        ["button"],
        expect.objectContaining({ forceUpdate: true }),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Successfully upgraded"),
      );
    });

    it("prompts for component selection when not --yes", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button", "card"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/component.tsx",
        installPath: "src",
      });
      mockInteractivePrompt.mockResolvedValue({ selectedComponents: ["button"] });
      mockConfirmAction.mockResolvedValue(true);
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      const result = await upgradeComponents({ yes: false, prefix: "src" });

      expect(result).toBe(true);
      expect(mockInteractivePrompt).toHaveBeenCalled();
    });

    it("cancels when no components selected", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
      });
      mockInteractivePrompt.mockResolvedValue({ selectedComponents: [] });

      const result = await upgradeComponents({ yes: false, prefix: "src" });

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No components selected"),
      );
    });

    it("handles missing components gracefully", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button", "missing"]);
      mockFindComponentLocation.mockImplementation((name) => {
        if (name === "button") {
          return { componentPath: "/project/src/tambo/button.tsx", installPath: "src" };
        }
        return null;
      });
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Could not locate"),
      );
    });

    it("handles legacy components", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
        needsCreation: true, // Marks as legacy
      });
      mockConfirmAction.mockResolvedValue(false);
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      const result = await upgradeComponents({ yes: false, prefix: "src" });

      expect(result).toBe(true);
    });

    it("handles component upgrade errors", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
      });
      mockInstallComponents.mockRejectedValue(new Error("Install failed"));

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true); // Still returns true as it's not a fatal error
      expect(mockOraFail).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update"),
      );
    });

    it("returns false on critical error", async () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error("Critical error");
      });

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upgrade components"),
      );
    });

    it("handles cross-location dependencies", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button", "card"]);
      mockFindComponentLocation.mockImplementation((name) => {
        if (name === "button") {
          return { componentPath: "/project/src/tambo/button.tsx", installPath: "src", needsCreation: true };
        }
        return { componentPath: "/project/src/tambo/card.tsx", installPath: "src" };
      });
      mockDetectCrossLocationDependencies.mockResolvedValue([
        { main: "card", mainLocation: "tambo", dependency: "button", depLocation: "ui" },
      ]);
      mockHandleDependencyInconsistencies.mockResolvedValue(true);
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      const result = await upgradeComponents({ yes: true, prefix: "src" });

      expect(result).toBe(true);
      expect(mockOraFail).toHaveBeenCalledWith(
        expect.stringContaining("inconsistencies"),
      );
    });

    it("calls tailwind setup after successful upgrades", async () => {
      mockExistsSync.mockReturnValue(true);
      mockGetInstalledComponents.mockResolvedValue(["button"]);
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
      });
      mockInstallComponents.mockResolvedValue(undefined);
      mockSetupTailwindAndGlobals.mockResolvedValue(undefined);

      await upgradeComponents({ yes: true, prefix: "src" });

      expect(mockSetupTailwindAndGlobals).toHaveBeenCalled();
    });
  });
});
