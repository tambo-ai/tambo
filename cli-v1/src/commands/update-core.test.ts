import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraFail = jest.fn();
const mockOra = jest.fn(() => ({
  start: mockOraStart.mockReturnThis(),
  succeed: mockOraSucceed,
  fail: mockOraFail,
}));

const mockGetInstalledComponents = jest.fn<() => Promise<string[]>>();
const mockComponentExists = jest.fn<(name: string) => boolean>();
const mockGetInstallationPath = jest.fn<() => Promise<string>>();
const mockInstallComponents =
  jest.fn<(components: string[], options: unknown) => Promise<void>>();
const mockSetupTailwindAndGlobals = jest.fn<() => Promise<void>>();
const mockInteractivePrompt = jest.fn<() => Promise<{ confirm: boolean }>>();
const mockResolveDependenciesForComponents =
  jest.fn<
    () => Promise<{ existingDependencies: string[]; newDependencies: string[] }>
  >();
const mockDisplayDependencyInfo = jest.fn();
const mockExpandComponentsWithDependencies =
  jest.fn<(components: unknown[]) => Promise<unknown[]>>();
const mockFindComponentLocation = jest.fn<
  (
    name: string,
    projectRoot: string,
    installPath: string,
    isExplicitPrefix: boolean,
  ) => {
    componentPath: string;
    installPath: string;
    needsCreation?: boolean;
  } | null
>();
const mockDetectCrossLocationDependencies =
  jest.fn<() => Promise<Array<unknown>>>();
const mockHandleDependencyInconsistencies = jest.fn<() => Promise<boolean>>();
const mockGetLegacyComponentDirectoryPath = jest.fn<() => string>();

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

jest.unstable_mockModule("./add/utils.js", () => ({
  getInstalledComponents: mockGetInstalledComponents,
  componentExists: mockComponentExists,
}));

jest.unstable_mockModule("./init.js", () => ({
  getInstallationPath: mockGetInstallationPath,
}));

jest.unstable_mockModule("./add/component.js", () => ({
  installComponents: mockInstallComponents,
}));

jest.unstable_mockModule("./add/tailwind-setup.js", () => ({
  setupTailwindAndGlobals: mockSetupTailwindAndGlobals,
}));

jest.unstable_mockModule("../utils/interactive.js", () => ({
  interactivePrompt: mockInteractivePrompt,
  NonInteractiveError: class NonInteractiveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NonInteractiveError";
    }
  },
}));

jest.unstable_mockModule("../utils/dependency-resolution.js", () => ({
  resolveDependenciesForComponents: mockResolveDependenciesForComponents,
  displayDependencyInfo: mockDisplayDependencyInfo,
  expandComponentsWithDependencies: mockExpandComponentsWithDependencies,
}));

jest.unstable_mockModule("./shared/component-utils.js", () => ({
  findComponentLocation: mockFindComponentLocation,
  detectCrossLocationDependencies: mockDetectCrossLocationDependencies,
  handleDependencyInconsistencies: mockHandleDependencyInconsistencies,
}));

jest.unstable_mockModule("../utils/path-utils.js", () => ({
  getLegacyComponentDirectoryPath: mockGetLegacyComponentDirectoryPath,
}));

// Suppress console output
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock process.exit
const mockProcessExit = jest.fn<(code?: number) => never>();
const originalProcessExit = process.exit;

const { handleUpdateComponents } = await import("./update-core.js");

describe("update-core", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = mockProcessExit as typeof process.exit;
    mockGetInstallationPath.mockResolvedValue("src");
    mockGetInstalledComponents.mockResolvedValue([]);
    mockComponentExists.mockReturnValue(true);
    mockResolveDependenciesForComponents.mockResolvedValue({
      existingDependencies: [],
      newDependencies: [],
    });
    mockExpandComponentsWithDependencies.mockImplementation(async (components) =>
      await Promise.resolve(components),
    );
    mockDetectCrossLocationDependencies.mockResolvedValue([]);
    mockHandleDependencyInconsistencies.mockResolvedValue(false);
    mockFindComponentLocation.mockReturnValue({
      componentPath: "/project/src/tambo/button.tsx",
      installPath: "src",
    });
    mockInstallComponents.mockResolvedValue(undefined);
    mockSetupTailwindAndGlobals.mockResolvedValue(undefined);
    mockGetLegacyComponentDirectoryPath.mockReturnValue("src/components/ui");
    mockInteractivePrompt.mockResolvedValue({ confirm: true });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe("handleUpdateComponents", () => {
    it("throws error when no component names provided", async () => {
      await expect(handleUpdateComponents([])).rejects.toThrow(
        /Please specify at least one component/,
      );
    });

    it("handles 'installed' keyword with no installed components", async () => {
      mockGetInstalledComponents.mockResolvedValue([]);

      await handleUpdateComponents(["installed"]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No tambo components are currently installed"),
      );
    });

    it("handles 'installed' keyword with installed components", async () => {
      mockGetInstalledComponents.mockResolvedValue(["button"]);

      await handleUpdateComponents(["installed"], { yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Found 1 installed components"),
      );
    });

    it("throws error for non-existent component in registry", async () => {
      mockComponentExists.mockReturnValue(false);

      await expect(handleUpdateComponents(["nonexistent"])).rejects.toThrow(
        /not found in registry/,
      );
    });

    it("shows missing components warning when component not installed", async () => {
      mockFindComponentLocation.mockReturnValue(null);

      await handleUpdateComponents(["button"]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("not installed in your project"),
      );
    });

    it("returns early when all components are missing", async () => {
      mockFindComponentLocation.mockReturnValue(null);

      await handleUpdateComponents(["button", "card"]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No components to update"),
      );
    });

    it("skips update when user cancels confirmation", async () => {
      mockInteractivePrompt.mockResolvedValue({ confirm: false });

      await handleUpdateComponents(["button"]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Update cancelled"),
      );
    });

    it("proceeds with update with --yes flag", async () => {
      await handleUpdateComponents(["button"], { yes: true });

      // Verifies the flow proceeds to the point of showing the update plan
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Components to be updated"),
      );
    });

    it("displays dependency info when resolving", async () => {
      await handleUpdateComponents(["button"], { yes: true });

      expect(mockDisplayDependencyInfo).toHaveBeenCalled();
    });

    it("silent mode suppresses output", async () => {
      await handleUpdateComponents(["button"], { yes: true, silent: true });

      // Should have far fewer console.log calls
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("resolves dependencies during update", async () => {
      await handleUpdateComponents(["button"], { yes: true });

      expect(mockResolveDependenciesForComponents).toHaveBeenCalled();
    });

    it("shows partial success when some components fail", async () => {
      mockExpandComponentsWithDependencies.mockResolvedValue([
        { name: "button", installPath: "src" },
        { name: "card", installPath: "src" },
      ]);
      mockInstallComponents
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Failed"));

      await handleUpdateComponents(["button"], { yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Updated 1 of 2 components"),
      );
    });

    it("handles legacy component locations", async () => {
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/ui/button.tsx",
        installPath: "src",
        needsCreation: true,
      });

      await handleUpdateComponents(["button"], { yes: true });

      // Should proceed with update for legacy components
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Components to be updated"),
      );
    });

    it("handles cross-location dependencies when both legacy and new components exist", async () => {
      // First return legacy, then new location
      mockFindComponentLocation
        .mockReturnValueOnce({
          componentPath: "/project/src/ui/button.tsx",
          installPath: "src",
          needsCreation: true,
        })
        .mockReturnValueOnce({
          componentPath: "/project/src/tambo/card.tsx",
          installPath: "src",
        })
        // Called again for recategorization
        .mockReturnValueOnce({
          componentPath: "/project/src/ui/button.tsx",
          installPath: "src",
          needsCreation: true,
        })
        .mockReturnValueOnce({
          componentPath: "/project/src/tambo/card.tsx",
          installPath: "src",
        });

      mockExpandComponentsWithDependencies.mockResolvedValue([
        { name: "button", installPath: "src" },
        { name: "card", installPath: "src" },
      ]);

      mockDetectCrossLocationDependencies.mockResolvedValue([
        {
          main: "card",
          mainLocation: "tambo",
          dependency: "button",
          depLocation: "ui",
        },
      ]);

      await handleUpdateComponents(["button", "card"], { yes: true });

      expect(mockDetectCrossLocationDependencies).toHaveBeenCalled();
    });

    it("shows auto-proceed message with --yes flag", async () => {
      mockFindComponentLocation.mockReturnValue({
        componentPath: "/project/src/tambo/button.tsx",
        installPath: "src",
      });

      await handleUpdateComponents(["button"], { yes: true });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Auto-proceeding with update"),
      );
    });

    it("uses custom prefix when provided", async () => {
      await handleUpdateComponents(["button"], {
        yes: true,
        prefix: "custom/path",
      });

      expect(mockFindComponentLocation).toHaveBeenCalledWith(
        "button",
        expect.any(String),
        "custom/path",
        true,
      );
    });
  });
});
