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
jest.unstable_mockModule("../add/utils.js", () => ({
  getConfigPath: (componentName: string) =>
    `/custom/registry/components/${componentName}/config.json`,
}));

// Mock upgrade utils to avoid interactive prompts
jest.unstable_mockModule("../upgrade/utils.js", () => ({
  confirmAction: jest.fn(async () => false),
  migrateComponentsDuringUpgrade: jest.fn(async () => {}),
}));

// Import after mocking
const {
  findComponentLocation,
  detectCrossLocationDependencies,
  handleDependencyInconsistencies,
} = await import("./component-utils.js");

describe("Component Location Utilities", () => {
  let originalCwd: () => string;

  beforeEach(() => {
    vol.reset();
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;
  });

  describe("findComponentLocation", () => {
    it("finds component in tambo/ location", () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = findComponentLocation(
        "message",
        "/mock-project",
        "src/components",
        false,
      );

      expect(result).not.toBeNull();
      expect(result?.componentPath).toBe(
        "/mock-project/src/components/tambo/message.tsx",
      );
      expect(result?.needsCreation).toBeUndefined();
    });

    it("finds component in ui/ legacy location", () => {
      vol.fromJSON({
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = findComponentLocation(
        "message",
        "/mock-project",
        "src/components",
        false,
      );

      expect(result).not.toBeNull();
      // Returns new path as destination, but marks needsCreation
      expect(result?.componentPath).toBe(
        "/mock-project/src/components/tambo/message.tsx",
      );
      expect(result?.needsCreation).toBe(true);
    });

    it("returns null when component not found", () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/.gitkeep": "",
      });

      const result = findComponentLocation(
        "nonexistent",
        "/mock-project",
        "src/components",
        false,
      );

      expect(result).toBeNull();
    });

    it("uses exact path when isExplicitPrefix=true", () => {
      vol.fromJSON({
        "/mock-project/custom/path/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = findComponentLocation(
        "message",
        "/mock-project",
        "custom/path",
        true,
      );

      expect(result).not.toBeNull();
      expect(result?.componentPath).toBe(
        "/mock-project/custom/path/message.tsx",
      );
    });

    it("does not check legacy location when isExplicitPrefix=true", () => {
      vol.fromJSON({
        "/mock-project/custom/path/ui/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = findComponentLocation(
        "message",
        "/mock-project",
        "custom/path",
        true,
      );

      expect(result).toBeNull();
    });

    it("prefers tambo/ over ui/ when both exist", () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div>New</div>;",
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div>Legacy</div>;",
      });

      const result = findComponentLocation(
        "message",
        "/mock-project",
        "src/components",
        false,
      );

      expect(result).not.toBeNull();
      expect(result?.needsCreation).toBeUndefined();
    });
  });

  describe("detectCrossLocationDependencies", () => {
    it("detects dependency in different location than main", async () => {
      vol.fromJSON({
        // Message in ui/ depends on markdown-components
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
        // markdown-components in tambo/
        "/mock-project/src/components/tambo/markdown-components.tsx":
          "export const Markdown = () => <div />;",
        // Config showing message requires markdown-components
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
          files: [{ name: "message.tsx" }],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            files: [{ name: "markdown-components.tsx" }],
          }),
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "message", installPath: "src/components" }],
        "src/components",
        false,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        main: "message",
        mainLocation: "ui",
        dependency: "markdown-components",
        depLocation: "tambo",
      });
    });

    it("returns empty array when no inconsistencies", async () => {
      vol.fromJSON({
        // Both in tambo/
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/src/components/tambo/markdown-components.tsx":
          "export const Markdown = () => <div />;",
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
          files: [{ name: "message.tsx" }],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            files: [{ name: "markdown-components.tsx" }],
          }),
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "message", installPath: "src/components" }],
        "src/components",
        false,
      );

      expect(result).toHaveLength(0);
    });

    it("deduplicates duplicate input components", async () => {
      vol.fromJSON({
        // Multiple components depending on same cross-location component
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/src/components/ui/form.tsx":
          "export const Form = () => <div />;",
        "/mock-project/src/components/tambo/markdown-components.tsx":
          "export const Markdown = () => <div />;",
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: ["markdown-components"],
          files: [{ name: "message.tsx" }],
        }),
        "/custom/registry/components/form/config.json": JSON.stringify({
          name: "form",
          requires: [],
          files: [{ name: "form.tsx" }],
        }),
        "/custom/registry/components/markdown-components/config.json":
          JSON.stringify({
            name: "markdown-components",
            files: [{ name: "markdown-components.tsx" }],
          }),
      });

      const result = await detectCrossLocationDependencies(
        [
          { name: "message", installPath: "src/components" },
          { name: "message", installPath: "src/components" }, // Duplicate
        ],
        "src/components",
        false,
      );

      // Should only have one inconsistency despite duplicate input
      const messageInconsistencies = result.filter((r) => r.main === "message");
      expect(messageInconsistencies).toHaveLength(1);
    });

    it("skips components without config", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        // No config file for message
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "message", installPath: "src/components" }],
        "src/components",
        false,
      );

      expect(result).toHaveLength(0);
    });

    it("detects inconsistencies in support files", async () => {
      vol.fromJSON({
        // Main component in tambo/
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        // Support component in ui/
        "/mock-project/src/components/ui/message-bubble.tsx":
          "export const MessageBubble = () => <div />;",
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          requires: [],
          files: [
            { name: "message.tsx" },
            { name: "message-bubble.tsx" }, // Support file
          ],
        }),
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "message", installPath: "src/components" }],
        "src/components",
        false,
      );

      expect(result).toHaveLength(1);
      expect(result[0].dependency).toBe("message-bubble");
    });

    it("handles JSON parse errors gracefully", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        "/custom/registry/components/message/config.json": "invalid json{",
      });

      const result = await detectCrossLocationDependencies(
        [{ name: "message", installPath: "src/components" }],
        "src/components",
        false,
      );

      // Should not throw, just continue
      expect(result).toHaveLength(0);
    });
  });

  describe("handleDependencyInconsistencies", () => {
    let logSpy: jest.SpiedFunction<typeof console.log>;

    beforeEach(() => {
      logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it("returns false when no inconsistencies", async () => {
      const result = await handleDependencyInconsistencies(
        [],
        [],
        "src/components",
      );

      expect(result).toBe(false);
    });

    it("logs inconsistencies and returns false when user declines migration", async () => {
      const inconsistencies = [
        {
          main: "message",
          mainLocation: "ui" as const,
          dependency: "markdown-components",
          depLocation: "tambo" as const,
        },
      ];

      // confirmAction is mocked to return false
      const result = await handleDependencyInconsistencies(
        inconsistencies,
        ["message"],
        "src/components",
      );

      expect(result).toBe(false);
      const output = logSpy.mock.calls.flat().map(String).join(" ");
      expect(output).toContain("Mixed component locations detected");
      expect(output).toContain("message");
      expect(output).toContain("markdown-components");
    });
  });
});
