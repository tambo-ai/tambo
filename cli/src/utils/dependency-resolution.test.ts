import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

// Mock fs module before importing
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Mock the registry utilities
jest.unstable_mockModule("../commands/add/utils.js", () => ({
  componentExists: (componentName: string) => {
    const configPath = `/custom/registry/components/${componentName}/config.json`;
    return memfsFs.existsSync(configPath);
  },
  getConfigPath: (componentName: string) =>
    `/custom/registry/components/${componentName}/config.json`,
}));

// Mock component-utils to avoid circular dependencies
jest.unstable_mockModule("../commands/shared/component-utils.js", () => ({
  findComponentLocation: (
    componentName: string,
    projectRoot: string,
    installPath: string,
  ) => {
    const componentPath = `${projectRoot}/${installPath}/tambo/${componentName}.tsx`;
    if (memfsFs.existsSync(componentPath)) {
      return { componentPath, installPath };
    }
    return null;
  },
}));

// Import after mocking
const {
  resolveComponentDependencies,
  resolveDependenciesForComponents,
  displayDependencyInfo,
  expandComponentsWithDependencies,
} = await import("./dependency-resolution.js");

// Helpers for coarse substring checks against output captured via the single `logSpy`.
const getLogCalls = (
  logSpy: jest.SpiedFunction<typeof console.log>,
): string[] =>
  logSpy.mock.calls.map((call) => call.map((arg) => String(arg)).join(" "));

const getLoggedOutput = (
  logSpy: jest.SpiedFunction<typeof console.log>,
): string => getLogCalls(logSpy).join("\n");

const hasLoggedSubstring = (
  logSpy: jest.SpiedFunction<typeof console.log>,
  substring: string,
): boolean => getLoggedOutput(logSpy).includes(substring);

describe("Dependency Resolution", () => {
  let originalCwd: () => string;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    vol.reset();
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;
    logSpy.mockRestore();
  });

  describe("resolveComponentDependencies", () => {
    it("returns component name for component with no dependencies", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: [],
        }),
      });

      const result = await resolveComponentDependencies("message");

      expect(result).toEqual(["message"]);
    });

    it("resolves direct dependencies", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            requires: [],
          }),
      });

      const result = await resolveComponentDependencies("message");

      expect(result).toContain("message");
      expect(result).toContain("markdown-components");
    });

    it("resolves nested dependencies (2+ levels)", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            requires: ["code-block"],
          }),
        "/custom/registry/components/code-block/config.json": JSON.stringify({
          name: "code-block",
          requires: [],
        }),
      });

      const result = await resolveComponentDependencies("message");

      expect(result).toContain("message");
      expect(result).toContain("markdown-components");
      expect(result).toContain("code-block");
    });

    it("handles circular dependencies without infinite loop", async () => {
      vol.fromJSON({
        "/custom/registry/components/a/config.json": JSON.stringify({
          name: "a",
          requires: ["b"],
        }),
        "/custom/registry/components/b/config.json": JSON.stringify({
          name: "b",
          requires: ["a"], // Circular!
        }),
      });

      // Should not hang - the visited set prevents infinite recursion
      const result = await resolveComponentDependencies("a");

      expect(result).toContain("a");
      expect(result).toContain("b");
    });

    it("throws for non-existent component", async () => {
      vol.fromJSON({
        "/custom/registry/components/.gitkeep": "",
      });

      await expect(resolveComponentDependencies("nonexistent")).rejects.toThrow(
        "not found in registry",
      );
    });

    it("throws for non-existent dependency", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["nonexistent-dep"],
        }),
      });

      await expect(resolveComponentDependencies("message")).rejects.toThrow(
        "not found in registry",
      );
    });
  });

  describe("resolveDependenciesForComponents", () => {
    it("categorizes installed vs missing dependencies", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components", "code-block"],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            requires: [],
          }),
        "/custom/registry/components/code-block/config.json": JSON.stringify({
          name: "code-block",
          requires: [],
        }),
      });

      const installed = new Set(["markdown-components"]);
      const result = await resolveDependenciesForComponents(
        [{ name: "message", installPath: "src/components" }],
        installed,
      );

      expect(result.installedDependencies).toContain("markdown-components");
      expect(result.missingDependencies).toContain("code-block");
      expect(result.missingDependencies).toContain("message");
    });

    it("handles multiple components with shared deps", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["shared-utils"],
        }),
        "/custom/registry/components/form/config.json": JSON.stringify({
          name: "form",
          requires: ["shared-utils"],
        }),
        "/custom/registry/components/shared-utils/config.json": JSON.stringify({
          name: "shared-utils",
          requires: [],
        }),
      });

      const result = await resolveDependenciesForComponents(
        [
          { name: "message", installPath: "src/components" },
          { name: "form", installPath: "src/components" },
        ],
        new Set(),
      );

      // shared-utils should only appear once
      const sharedCount = result.missingDependencies.filter(
        (d) => d === "shared-utils",
      ).length;
      expect(sharedCount).toBe(1);
    });

    it("builds dependency map correctly", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            requires: [],
          }),
      });

      const result = await resolveDependenciesForComponents(
        [{ name: "message", installPath: "src/components" }],
        new Set(),
      );

      expect(result.dependencyMap.get("message")).toContain(
        "markdown-components",
      );
    });

    it("handles component with no dependencies", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: [],
        }),
      });

      const result = await resolveDependenciesForComponents(
        [{ name: "message", installPath: "src/components" }],
        new Set(),
      );

      expect(result.dependencyMap.has("message")).toBe(false);
      expect(result.allComponents.has("message")).toBe(true);
    });

    it("suppresses output in silent mode", async () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["nonexistent"],
        }),
      });

      await resolveDependenciesForComponents(
        [{ name: "message", installPath: "src/components" }],
        new Set(),
        { silent: true },
      );

      // Should not log warnings in silent mode
      const hasWarning = hasLoggedSubstring(logSpy, "Failed to resolve");
      expect(hasWarning).toBe(false);
    });
  });

  describe("displayDependencyInfo", () => {
    it("displays installed dependencies being included", () => {
      const result = {
        dependencyMap: new Map([["message", ["markdown-components"]]]),
        allComponents: new Set(["message", "markdown-components"]),
        installedDependencies: ["message", "markdown-components"],
        missingDependencies: [],
      };

      displayDependencyInfo(result, [
        { name: "message", installPath: "src/components" },
      ]);

      const output = getLoggedOutput(logSpy);
      expect(output).toContain("Including installed dependencies");
      expect(output).toContain("markdown-components");
    });

    it("displays missing dependencies to be installed", () => {
      const result = {
        dependencyMap: new Map([["message", ["markdown-components"]]]),
        allComponents: new Set(["message", "markdown-components"]),
        installedDependencies: ["message"],
        missingDependencies: ["markdown-components"],
      };

      displayDependencyInfo(result, [
        { name: "message", installPath: "src/components" },
      ]);

      const output = getLoggedOutput(logSpy);
      expect(output).toContain("Installing missing dependencies");
      expect(output).toContain("markdown-components");
    });
  });

  describe("expandComponentsWithDependencies", () => {
    it("adds dependencies that are not in original list", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/markdown-components.tsx":
          "export const Markdown = () => <div />;",
      });

      const result = {
        dependencyMap: new Map([["message", ["markdown-components"]]]),
        allComponents: new Set(["message", "markdown-components"]),
        installedDependencies: ["markdown-components"],
        missingDependencies: [],
      };

      const expanded = await expandComponentsWithDependencies(
        [{ name: "message", installPath: "src/components" }],
        result,
        "/mock-project",
        "src/components",
        false,
      );

      expect(expanded).toHaveLength(2);
      expect(
        expanded.find((c) => c.name === "markdown-components"),
      ).toBeDefined();
    });

    it("does not duplicate components already in list", async () => {
      const result = {
        dependencyMap: new Map(),
        allComponents: new Set(["message"]),
        installedDependencies: ["message"],
        missingDependencies: [],
      };

      const expanded = await expandComponentsWithDependencies(
        [{ name: "message", installPath: "src/components" }],
        result,
        "/mock-project",
        "src/components",
        false,
      );

      const messageCount = expanded.filter((c) => c.name === "message").length;
      expect(messageCount).toBe(1);
    });

    it("uses base install path for missing dependencies", async () => {
      const result = {
        dependencyMap: new Map([["message", ["markdown-components"]]]),
        allComponents: new Set(["message", "markdown-components"]),
        installedDependencies: [],
        missingDependencies: ["message", "markdown-components"],
      };

      const expanded = await expandComponentsWithDependencies(
        [{ name: "message", installPath: "src/components" }],
        result,
        "/mock-project",
        "src/components",
        false,
      );

      const markdownComp = expanded.find(
        (c) => c.name === "markdown-components",
      );
      expect(markdownComp?.installPath).toBe("src/components");
    });
  });
});
