import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockComponentExists = jest.fn<(name: string) => boolean>();
const mockGetConfigPath = jest.fn<(name: string) => string>();
const mockReadFileSync = jest.fn<(path: unknown) => string>();
const mockFindComponentLocation = jest.fn();

jest.unstable_mockModule("../commands/add/utils.js", () => ({
  componentExists: mockComponentExists,
  getConfigPath: mockGetConfigPath,
}));

jest.unstable_mockModule("fs", () => ({
  default: { readFileSync: mockReadFileSync },
  readFileSync: mockReadFileSync,
}));

jest.unstable_mockModule("../commands/shared/component-utils.js", () => ({
  findComponentLocation: mockFindComponentLocation,
}));

// Suppress console output during tests
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

const {
  resolveComponentDependencies,
  resolveDependenciesForComponents,
  displayDependencyInfo,
  expandComponentsWithDependencies,
} = await import("./dependency-resolution.js");

describe("dependency-resolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("resolveComponentDependencies", () => {
    it("returns component alone when it has no dependencies", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockReturnValue("/registry/button/config.json");
      mockReadFileSync.mockReturnValue(JSON.stringify({ requires: [] }));

      const result = await resolveComponentDependencies("button");

      expect(result).toEqual(["button"]);
    });

    it("resolves direct dependencies", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockImplementation(
        (name: string) => `/registry/${name}/config.json`,
      );
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("message-input")) {
          return JSON.stringify({ requires: ["button", "icon"] });
        }
        return JSON.stringify({ requires: [] });
      });

      const result = await resolveComponentDependencies("message-input");

      expect(result).toContain("message-input");
      expect(result).toContain("button");
      expect(result).toContain("icon");
    });

    it("resolves nested dependencies", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockImplementation(
        (name: string) => `/registry/${name}/config.json`,
      );
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("thread")) {
          return JSON.stringify({ requires: ["message-input"] });
        }
        if (path.includes("message-input")) {
          return JSON.stringify({ requires: ["button"] });
        }
        return JSON.stringify({ requires: [] });
      });

      const result = await resolveComponentDependencies("thread");

      expect(result).toContain("thread");
      expect(result).toContain("message-input");
      expect(result).toContain("button");
    });

    it("handles circular dependencies", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockImplementation(
        (name: string) => `/registry/${name}/config.json`,
      );
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("a")) {
          return JSON.stringify({ requires: ["b"] });
        }
        if (path.includes("b")) {
          return JSON.stringify({ requires: ["a"] });
        }
        return JSON.stringify({ requires: [] });
      });

      // Should not infinite loop
      const result = await resolveComponentDependencies("a");

      expect(result).toContain("a");
      expect(result).toContain("b");
    });

    it("throws when component not found", async () => {
      mockComponentExists.mockReturnValue(false);
      mockGetConfigPath.mockReturnValue("/registry/unknown/config.json");

      await expect(resolveComponentDependencies("unknown")).rejects.toThrow(
        /not found in registry/,
      );
    });

    it("handles missing requires field", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockReturnValue("/registry/button/config.json");
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const result = await resolveComponentDependencies("button");

      expect(result).toEqual(["button"]);
    });
  });

  describe("resolveDependenciesForComponents", () => {
    it("resolves dependencies for multiple components", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockImplementation(
        (name: string) => `/registry/${name}/config.json`,
      );
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("form")) {
          return JSON.stringify({ requires: ["button", "input"] });
        }
        return JSON.stringify({ requires: [] });
      });

      const result = await resolveDependenciesForComponents(
        [{ name: "form", installPath: "src" }],
        new Set(),
        { silent: true },
      );

      expect(result.allComponents.has("form")).toBe(true);
      expect(result.allComponents.has("button")).toBe(true);
      expect(result.allComponents.has("input")).toBe(true);
    });

    it("categorizes installed vs missing dependencies", async () => {
      mockComponentExists.mockReturnValue(true);
      mockGetConfigPath.mockImplementation(
        (name: string) => `/registry/${name}/config.json`,
      );
      mockReadFileSync.mockImplementation((p) => {
        const path = String(p);
        if (path.includes("form")) {
          return JSON.stringify({ requires: ["button", "input"] });
        }
        return JSON.stringify({ requires: [] });
      });

      const installedComponents = new Set(["button"]);
      const result = await resolveDependenciesForComponents(
        [{ name: "form", installPath: "src" }],
        installedComponents,
        { silent: true },
      );

      expect(result.installedDependencies).toContain("button");
      expect(result.missingDependencies).toContain("input");
      expect(result.missingDependencies).toContain("form");
    });

    it("logs warning when dependency resolution fails", async () => {
      mockComponentExists.mockReturnValue(false);
      mockGetConfigPath.mockReturnValue("/registry/unknown/config.json");

      await resolveDependenciesForComponents(
        [{ name: "unknown", installPath: "src" }],
        new Set(),
        { silent: false },
      );

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("suppresses warnings in silent mode", async () => {
      mockComponentExists.mockReturnValue(false);
      mockGetConfigPath.mockReturnValue("/registry/unknown/config.json");

      await resolveDependenciesForComponents(
        [{ name: "unknown", installPath: "src" }],
        new Set(),
        { silent: true },
      );

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("displayDependencyInfo", () => {
    it("displays installed dependencies being included", () => {
      const result = {
        dependencyMap: new Map([["form", ["button"]]]),
        allComponents: new Set(["form", "button"]),
        installedDependencies: ["form", "button"],
        missingDependencies: [],
      };

      displayDependencyInfo(result, [{ name: "form", installPath: "src" }]);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("displays missing dependencies", () => {
      const result = {
        dependencyMap: new Map([["form", ["button"]]]),
        allComponents: new Set(["form", "button"]),
        installedDependencies: [],
        missingDependencies: ["form", "button"],
      };

      displayDependencyInfo(result, [{ name: "form", installPath: "src" }]);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("does not display anything when no extra dependencies", () => {
      const result = {
        dependencyMap: new Map(),
        allComponents: new Set(["form"]),
        installedDependencies: ["form"],
        missingDependencies: [],
      };

      displayDependencyInfo(result, [{ name: "form", installPath: "src" }]);

      // Only original component, no extra deps to show
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("expandComponentsWithDependencies", () => {
    it("expands with missing dependencies", async () => {
      mockFindComponentLocation.mockReturnValue(null);

      const result = await expandComponentsWithDependencies(
        [{ name: "form", installPath: "src" }],
        {
          dependencyMap: new Map([["form", ["button"]]]),
          allComponents: new Set(["form", "button"]),
          installedDependencies: [],
          missingDependencies: ["button"],
        },
        "/project",
        "src",
        false,
      );

      expect(result).toHaveLength(2);
      expect(result.find((c) => c.name === "form")).toBeDefined();
      expect(result.find((c) => c.name === "button")).toBeDefined();
    });

    it("uses existing location for installed dependencies", async () => {
      mockFindComponentLocation.mockReturnValue({
        installPath: "app/components",
        isExplicitPrefix: false,
      });

      const result = await expandComponentsWithDependencies(
        [{ name: "form", installPath: "src" }],
        {
          dependencyMap: new Map([["form", ["button"]]]),
          allComponents: new Set(["form", "button"]),
          installedDependencies: ["button"],
          missingDependencies: [],
        },
        "/project",
        "src",
        false,
      );

      const buttonComponent = result.find((c) => c.name === "button");
      expect(buttonComponent?.installPath).toBe("app/components");
    });

    it("does not duplicate existing components", async () => {
      const result = await expandComponentsWithDependencies(
        [
          { name: "form", installPath: "src" },
          { name: "button", installPath: "src" },
        ],
        {
          dependencyMap: new Map([["form", ["button"]]]),
          allComponents: new Set(["form", "button"]),
          installedDependencies: ["button"],
          missingDependencies: [],
        },
        "/project",
        "src",
        false,
      );

      expect(result).toHaveLength(2);
    });
  });
});

