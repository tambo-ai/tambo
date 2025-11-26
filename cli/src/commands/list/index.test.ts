import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";
import { createBasicProjectStructure } from "../../__fixtures__/mock-fs-setup.js";

// Mock fs module before importing the command
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Mock the utils module to provide test registry data
jest.unstable_mockModule("../add/utils.js", () => ({
  getTamboComponentInfo: () => ({
    mainComponents: new Set(["message", "form", "graph"]),
    supportComponents: new Set(["markdown-components"]),
    allComponents: new Set(["message", "form", "graph", "markdown-components"]),
  }),
  getKnownComponentNames: () =>
    new Set(["message", "form", "graph", "markdown-components"]),
}));

// Mock init.js to provide getInstallationPath
jest.unstable_mockModule("../init.js", () => ({
  getInstallationPath: async () => "src/components",
}));

// Mock the interactive module to make tests think they're in an interactive environment
// Note: list.test.ts doesn't use inquirer, but we mock it for consistency
jest.unstable_mockModule("../../utils/interactive.js", () => ({
  isInteractive: () => true, // Always return true in tests
  interactivePrompt: async (questions: unknown) => {
    // This command doesn't actually use prompts, but mock it anyway
    return questions;
  },
  NonInteractiveError: class NonInteractiveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NonInteractiveError";
    }
  },
}));

// Import after mocking
const { handleListComponents } = await import("./index.js");

describe("handleListComponents", () => {
  let originalCwd: () => string;
  let originalLog: typeof console.log;
  let logs: string[];

  beforeEach(() => {
    // Reset memfs volume
    vol.reset();

    // Mock process.cwd
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";

    // Capture console output
    logs = [];
    originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map((arg) => String(arg)).join(" "));
    };
  });

  afterEach(() => {
    // Clean up mocks
    vol.reset();
    process.cwd = originalCwd;
    console.log = originalLog;
  });

  describe("error cases", () => {
    it("should throw error when no package.json exists", async () => {
      // Setup: Empty filesystem
      vol.fromJSON({});

      // Execute and expect error
      await expect(handleListComponents()).rejects.toThrow(
        "No package.json found",
      );
    });
  });

  describe("empty project", () => {
    it("should show message when no components are installed", async () => {
      // Setup: Project with package.json but no components
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: [],
        legacyComponents: [],
        registryComponents: [],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify output
      expect(logs.join("\n")).toContain("No components installed yet");
    });
  });

  describe("new location (tambo/) components", () => {
    it("should list components in the new tambo/ directory", async () => {
      // Setup: Project with components in new location and matching registry
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message", "form"],
        registryComponents: [
          { name: "message", description: "Message component" },
          { name: "form", description: "Form component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify output
      const output = logs.join("\n");
      expect(output).toContain("Installed components:");
      expect(output).toContain("In tambo/:");
      expect(output).toContain("message");
      expect(output).toContain("form");
      expect(output).toContain("Total: 2 component(s)");
    });

    it("should categorize Tambo components correctly", async () => {
      // Setup: Project with main Tambo component
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message"],
        registryComponents: [
          { name: "message", description: "Message component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify categorization
      const output = logs.join("\n");
      expect(output).toContain("Tambo components:");
      expect(output).toContain("message");
      expect(output).toContain("(1 from Tambo, 0 custom)");
    });

    it("should categorize support components correctly", async () => {
      // Setup: Main component with support file
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message", "markdown-components"],
        registryComponents: [
          {
            name: "message",
            description: "Message component",
            files: ["markdown-components.tsx"],
          },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify support component categorization
      const output = logs.join("\n");
      expect(output).toContain("Tambo components:");
      expect(output).toContain("message");
      expect(output).toContain("Tambo support components:");
      expect(output).toContain("markdown-components");
      expect(output).toContain("(2 from Tambo, 0 custom)");
    });

    it("should identify custom components", async () => {
      // Setup: Mix of Tambo and custom components
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message", "custom-widget"],
        registryComponents: [
          { name: "message", description: "Message component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify custom component identification
      const output = logs.join("\n");
      expect(output).toContain("Tambo components:");
      expect(output).toContain("message");
      expect(output).toContain("Custom components:");
      expect(output).toContain("custom-widget");
      expect(output).toContain("(1 from Tambo, 1 custom)");
    });
  });

  describe("legacy location (ui/) components", () => {
    it("should list components in the legacy ui/ directory", async () => {
      // Setup: Project with components in legacy location
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        legacyComponents: ["message", "form"],
        registryComponents: [
          { name: "message", description: "Message component" },
          { name: "form", description: "Form component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify output
      const output = logs.join("\n");
      expect(output).toContain("In ui/ (legacy location):");
      expect(output).toContain("message");
      expect(output).toContain("form");
    });

    it("should show migration instructions for legacy Tambo components", async () => {
      // Setup: Tambo components in legacy location
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        legacyComponents: ["message"],
        registryComponents: [
          { name: "message", description: "Message component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify migration instructions
      const output = logs.join("\n");
      expect(output).toContain("To migrate to the new directory structure:");
      expect(output).toContain("Move all files from ui/ to tambo/");
      expect(output).toContain("npx tambo migrate");
    });

    it("should not show migration instructions for custom components only", async () => {
      // Setup: Only custom components in legacy location
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        legacyComponents: ["custom-widget"],
        registryComponents: [],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify no migration instructions for custom components
      const output = logs.join("\n");
      expect(output).toContain("Custom components:");
      expect(output).not.toContain(
        "To migrate to the new directory structure:",
      );
    });
  });

  describe("mixed locations", () => {
    it("should list components from both new and legacy locations", async () => {
      // Setup: Components in both locations
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message"],
        legacyComponents: ["form"],
        registryComponents: [
          { name: "message", description: "Message component" },
          { name: "form", description: "Form component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify both locations are shown
      const output = logs.join("\n");
      expect(output).toContain("In tambo/:");
      expect(output).toContain("In ui/ (legacy location):");
      expect(output).toContain("message");
      expect(output).toContain("form");
      expect(output).toContain("Total: 2 component(s)");
    });

    it("should handle duplicate components in both locations", async () => {
      // Setup: Same component in both locations (should count only once)
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message"],
        legacyComponents: ["message"],
        registryComponents: [
          { name: "message", description: "Message component" },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify output shows both locations
      const output = logs.join("\n");
      expect(output).toContain("In tambo/:");
      expect(output).toContain("In ui/ (legacy location):");
      expect(output).toContain("message");
    });
  });

  describe("with explicit prefix", () => {
    it("should use explicit prefix when provided", async () => {
      // Setup: Components at explicit path (not in tambo/ subdirectory)
      const structure: Record<string, string> = {
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
        }),
        "/mock-project/custom/path/message.tsx":
          "export const message = () => null;",
        "/mock-project/src/registry/message/config.json": JSON.stringify({
          name: "message",
          description: "Message component",
        }),
        "/mock-project/src/registry/message/message.tsx":
          "export const message = () => null;",
      };
      vol.fromJSON(structure);

      // Execute with explicit prefix
      await handleListComponents({ prefix: "custom/path" });

      // Verify - with explicit prefix, files are directly in that path
      const output = logs.join("\n");
      expect(output).toContain("message");
      // Should show that we found the component
      expect(output).toContain("Total: 1 component(s)");
    });
  });

  describe("summary statistics", () => {
    it("should show correct totals for mixed component types", async () => {
      // Setup: Mix of Tambo main, support, and custom components
      const structure = createBasicProjectStructure({
        hasPackageJson: true,
        newComponents: ["message", "markdown-components", "custom-widget"],
        registryComponents: [
          {
            name: "message",
            description: "Message component",
            files: ["markdown-components.tsx"],
          },
        ],
      });
      vol.fromJSON(structure);

      // Execute (no prefix - uses getInstallationPath)
      await handleListComponents();

      // Verify summary
      const output = logs.join("\n");
      expect(output).toContain("Total: 3 component(s)");
      expect(output).toContain("(2 from Tambo, 1 custom)");
    });
  });
});
