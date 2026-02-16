/**
 * Tests for dependency installer
 *
 * Mocks package manager and exec functions to avoid real npm installs.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { DependencySet, InstallationPlan } from "./types.js";

// Mock external dependencies
const mockExecFileSync = jest.fn();
const mockDetectPackageManager = jest.fn();
const mockValidatePackageManager = jest.fn();
const mockGetInstallCommand = jest.fn();
const mockGetDevFlag = jest.fn();
const mockFormatPackageArgs = jest.fn();
const mockOra = jest.fn();

// Set up module mocks
jest.unstable_mockModule("../interactive.js", () => ({
  execFileSync: mockExecFileSync,
}));

jest.unstable_mockModule("../package-manager.js", () => ({
  detectPackageManager: mockDetectPackageManager,
  validatePackageManager: mockValidatePackageManager,
  getInstallCommand: mockGetInstallCommand,
  getDevFlag: mockGetDevFlag,
  formatPackageArgs: mockFormatPackageArgs,
}));

jest.unstable_mockModule("ora", () => ({
  default: mockOra,
}));

// Import after mocks are set up
const { installDependencies, collectDependencies } =
  await import("./dependency-installer.js");

describe("dependency-installer", () => {
  let mockSpinner: {
    succeed: jest.Mock;
    fail: jest.Mock;
    start: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock spinner
    mockSpinner = {
      succeed: jest.fn(),
      fail: jest.fn(),
      start: jest.fn(function (this: typeof mockSpinner) {
        return this;
      }),
    };
    mockOra.mockReturnValue(mockSpinner);

    // Set up default mock implementations
    mockDetectPackageManager.mockReturnValue("npm");
    mockValidatePackageManager.mockImplementation(() => {});
    mockGetInstallCommand.mockReturnValue(["install"]);
    mockGetDevFlag.mockReturnValue("-D");
    mockFormatPackageArgs.mockImplementation((_, packages) => packages);
    mockExecFileSync.mockReturnValue("");
  });

  describe("installDependencies", () => {
    it("should skip installation when both arrays are empty", async () => {
      const deps: DependencySet = {
        dependencies: [],
        devDependencies: [],
      };

      await installDependencies(deps);

      expect(mockDetectPackageManager).not.toHaveBeenCalled();
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it("should install production dependencies", async () => {
      const deps: DependencySet = {
        dependencies: ["@tambo-ai/react", "zod"],
        devDependencies: [],
      };

      mockFormatPackageArgs.mockReturnValue(["@tambo-ai/react", "zod"]);

      await installDependencies(deps);

      expect(mockDetectPackageManager).toHaveBeenCalled();
      expect(mockValidatePackageManager).toHaveBeenCalledWith("npm");
      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        ["install", "@tambo-ai/react", "zod"],
        expect.objectContaining({
          stdio: "pipe",
          encoding: "utf-8",
          allowNonInteractive: false,
        }),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        expect.stringContaining("2 dependencies"),
      );
    });

    it("should install dev dependencies", async () => {
      const deps: DependencySet = {
        dependencies: [],
        devDependencies: ["@types/node", "typescript"],
      };

      mockFormatPackageArgs.mockReturnValue(["@types/node", "typescript"]);

      await installDependencies(deps);

      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        ["install", "-D", "@types/node", "typescript"],
        expect.objectContaining({
          stdio: "pipe",
          encoding: "utf-8",
          allowNonInteractive: false,
        }),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        expect.stringContaining("2 dev dependencies"),
      );
    });

    it("should install both production and dev dependencies sequentially", async () => {
      const deps: DependencySet = {
        dependencies: ["@tambo-ai/react"],
        devDependencies: ["typescript"],
      };

      mockFormatPackageArgs.mockImplementation((_, packages) => packages);

      await installDependencies(deps);

      // Should be called twice: once for prod, once for dev
      expect(mockExecFileSync).toHaveBeenCalledTimes(2);

      // First call: production deps
      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        1,
        "npm",
        ["install", "@tambo-ai/react"],
        expect.any(Object),
      );

      // Second call: dev deps
      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        "npm",
        ["install", "-D", "typescript"],
        expect.any(Object),
      );
    });

    it("should throw on installation failure", async () => {
      const deps: DependencySet = {
        dependencies: ["@tambo-ai/react"],
        devDependencies: [],
      };

      mockFormatPackageArgs.mockReturnValue(["@tambo-ai/react"]);
      const installError = new Error("npm install failed");
      mockExecFileSync.mockImplementationOnce(() => {
        throw installError;
      });

      await expect(installDependencies(deps)).rejects.toThrow(
        /Failed to install/,
      );

      expect(mockSpinner.fail).toHaveBeenCalled();
    });

    it("should pass yes option as allowNonInteractive", async () => {
      const deps: DependencySet = {
        dependencies: ["@tambo-ai/react"],
        devDependencies: [],
      };

      mockFormatPackageArgs.mockReturnValue(["@tambo-ai/react"]);

      await installDependencies(deps, { yes: true });

      expect(mockExecFileSync).toHaveBeenCalledWith(
        "npm",
        ["install", "@tambo-ai/react"],
        expect.objectContaining({
          allowNonInteractive: true,
        }),
      );
    });
  });

  describe("collectDependencies", () => {
    const mockPlan: InstallationPlan = {
      providerSetup: {
        filePath: "/path/to/layout.tsx",
        nestingLevel: 0,
        rationale: "Test rationale",
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/path/to/widget.tsx",
        position: "bottom-right",
        rationale: "Test rationale",
        confidence: 0.9,
      },
    };

    it("should always include @tambo-ai/react", () => {
      const result = collectDependencies(mockPlan, []);

      expect(result.dependencies).toContain("@tambo-ai/react");
    });

    it("should add zod when tools are selected", () => {
      const result = collectDependencies(mockPlan, ["tool-searchProducts"]);

      expect(result.dependencies).toContain("@tambo-ai/react");
      expect(result.dependencies).toContain("zod");
    });

    it("should not add zod when no tools are selected", () => {
      const result = collectDependencies(mockPlan, [
        "component-myComponent",
        "interactable-myAction",
      ]);

      expect(result.dependencies).toContain("@tambo-ai/react");
      expect(result.dependencies).not.toContain("zod");
    });

    it("should return empty devDependencies", () => {
      const result = collectDependencies(mockPlan, []);

      expect(result.devDependencies).toEqual([]);
    });
  });
});
