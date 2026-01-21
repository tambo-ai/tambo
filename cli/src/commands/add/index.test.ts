import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";
import { toTreeSync } from "memfs/lib/print";
import {
  createBasicProject,
  createProjectWithTamboSDK,
  createRegistryFiles,
} from "../../__fixtures__/mock-fs-setup.js";

// Mock fs module before importing the command
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Mock child_process for npm install
let execSyncCalls: string[] = [];
const mockExecSync = (command: string) => {
  execSyncCalls.push(command);
  return "";
};
const mockExecFileSync = (file: string, args?: readonly string[]) => {
  const commandStr = args ? `${file} ${args.join(" ")}` : file;
  execSyncCalls.push(commandStr);
  return "";
};
jest.unstable_mockModule("child_process", () => ({
  execSync: mockExecSync,
  execFileSync: mockExecFileSync,
}));

// Mock inquirer for user prompts
let inquirerResponses: Record<string, unknown> = {};
const mockPrompt = async (
  question:
    | { name: string; default?: unknown }
    | { name: string; default?: unknown }[],
) => {
  const questions = Array.isArray(question) ? question : [question];
  const responses: Record<string, unknown> = {};
  for (const q of questions) {
    responses[q.name] =
      inquirerResponses[q.name] !== undefined
        ? inquirerResponses[q.name]
        : q.default;
  }
  return responses;
};

jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: mockPrompt,
  },
}));

// Mock init.js to provide getInstallationPath
jest.unstable_mockModule("../init.js", () => ({
  getInstallationPath: async () => "src/components",
}));

// Mock tailwind setup
jest.unstable_mockModule("./tailwind-setup.js", () => ({
  setupTailwindAndGlobals: jest.fn(async () => {
    // No-op for tests
  }),
}));

// Mock migrate.js updateImportPaths function
jest.unstable_mockModule("../migrate.js", () => ({
  updateImportPaths: (content: string, _targetLocation: string) => content,
}));

// Mock the registry utilities to use memfs paths
jest.unstable_mockModule("./utils.js", () => ({
  getRegistryBasePath: () => `/mock-project/cli/dist/registry`,
  getRegistryPath: (componentName: string) =>
    `/mock-project/cli/dist/registry/components/${componentName}`,
  getConfigPath: (componentName: string) =>
    `/mock-project/cli/dist/registry/components/${componentName}/config.json`,
  componentExists: (componentName: string) => {
    const configPath = `/mock-project/cli/dist/registry/components/${componentName}/config.json`;
    try {
      return (
        memfsFs.existsSync(configPath) &&
        JSON.parse(memfsFs.readFileSync(configPath, "utf-8") as string)
      );
    } catch {
      return false;
    }
  },
  getTamboComponentInfo: () => ({
    mainComponents: new Set(["message", "form", "graph"]),
    supportComponents: new Set(["markdown-components"]),
    allComponents: new Set(["message", "form", "graph", "markdown-components"]),
  }),
  getKnownComponentNames: () =>
    new Set(["message", "form", "graph", "markdown-components"]),
  checkLegacyComponents: () => null,
  getInstalledComponents: async () => [],
  getComponentList: () => [],
}));

// Mock the interactive module to make tests think they're in an interactive environment
jest.unstable_mockModule("../../utils/interactive.js", () => ({
  isInteractive: () => true, // Always return true in tests
  interactivePrompt: mockPrompt, // Use the same mockPrompt as inquirer
  execSync: mockExecSync, // Use the same mockExecSync as child_process
  execFileSync: mockExecFileSync, // Use the same mockExecFileSync as child_process
  NonInteractiveError: class NonInteractiveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NonInteractiveError";
    }
  },
}));

// Import after mocking
const { handleAddComponents } = await import("./index.js");

describe("handleAddComponents", () => {
  let originalCwd: () => string;
  let originalLog: typeof console.log;
  let logs: string[];

  beforeEach(() => {
    // Reset memfs volume
    vol.reset();

    // Reset exec calls
    execSyncCalls = [];

    // Reset inquirer responses
    inquirerResponses = {};

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
    execSyncCalls = [];
    inquirerResponses = {};
  });

  describe("error cases", () => {
    it("should error when no component names provided", async () => {
      // Setup: Empty filesystem
      vol.fromJSON({});

      // Execute with empty array
      await handleAddComponents([]);

      // Verify error message
      const output = logs.join("\n");
      expect(output).toContain("Please specify at least one component name");
    });

    it("should throw error when no package.json exists", async () => {
      // Setup: Empty filesystem
      vol.fromJSON({});

      // Execute and expect error
      await expect(handleAddComponents(["message"])).rejects.toThrow(
        "No package.json found",
      );
    });

    it("should throw error when component not found in registry", async () => {
      // Setup: Project with package.json but no registry
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({ name: "test-project" }),
      });

      // Execute with non-existent component
      await expect(
        handleAddComponents(["nonexistent-component"], { yes: true }),
      ).rejects.toThrow("not found in registry");
    });
  });

  describe("basic installation", () => {
    it("should install a single component successfully", async () => {
      // Setup: Project with package.json and registry
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message"]),
      });

      // Execute with --yes flag to skip prompts
      await handleAddComponents(["message"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify npm install was called for missing dependencies
      expect(execSyncCalls.length).toBeGreaterThan(0);
      const npmInstalls = execSyncCalls.filter((cmd) =>
        cmd.includes("npm install"),
      );
      expect(npmInstalls.length).toBeGreaterThan(0);
      expect(npmInstalls.some((cmd) => cmd.includes("@tambo-ai/react"))).toBe(
        true,
      );

      // Verify success message
      const output = logs.join("\n");
      expect(output).toContain("Installation complete");
    });

    it("should install multiple components", async () => {
      // Setup: Project with package.json and registry with multiple components
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message", "form"]),
      });

      // Execute with multiple components
      await handleAddComponents(["message", "form"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     ├─ form.tsx
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify success message mentions both
      const output = logs.join("\n");
      expect(output).toContain("Installation complete");
    });

    it("should skip already installed components", async () => {
      // Setup: Project with already installed component
      vol.fromJSON({
        ...createProjectWithTamboSDK(),
        ...createRegistryFiles(["message"]),
        // Component already exists
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div>Existing</div>;",
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify message about already installed
      const output = logs.join("\n");
      expect(output).toContain("already installed");

      // Verify file wasn't modified (still has "Existing")
      const content = vol.readFileSync(
        "/mock-project/src/components/tambo/message.tsx",
        "utf-8",
      ) as string;
      expect(content).toContain("Existing");
    });

    it("should install only new components when some are already installed", async () => {
      // Setup: Project with one component already installed
      vol.fromJSON({
        ...createProjectWithTamboSDK(),
        ...createRegistryFiles(["message", "form"]),
        // Message already exists
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div>Existing</div>;",
      });

      // Execute
      await handleAddComponents(["message", "form"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     ├─ form.tsx
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify output mentions both
      const output = logs.join("\n");
      expect(output).toContain("Already installed");
      expect(output).toContain("message");
    });
  });

  describe("dependency resolution", () => {
    it("should install component dependencies", async () => {
      // Setup: Component with dependencies
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message"]),
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify output mentions dependency resolution
      const output = logs.join("\n");
      expect(output).toContain("Resolving dependencies");
    });

    it("should handle circular dependencies gracefully", async () => {
      // Setup: Components with circular dependency
      // Note: createRegistryFiles will create both components since component-a requires component-b
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["component-a"]),
        // Override to set circular dependency
        "/mock-project/cli/dist/registry/components/component-b/config.json":
          JSON.stringify({
            name: "component-b",
            description: "Component B",
            dependencies: [],
            devDependencies: [],
            requires: ["component-a"],
            files: [
              {
                name: "component-b.tsx",
                content: "export const B = () => <div>B</div>;",
              },
            ],
          }),
      });

      // Execute - should not hang or error
      await handleAddComponents(["component-a"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ component-a.tsx
        └─ lib/
           └─ utils.ts"
      `);
    });
  });

  describe("legacy location handling", () => {
    it("should install to legacy location when components exist there", async () => {
      // Setup: Project with components in legacy ui/ directory
      vol.fromJSON({
        ...createProjectWithTamboSDK(),
        ...createRegistryFiles(["message", "form"]),
        // Existing component in legacy location
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div>Legacy</div>;",
      });

      // Execute - install form to maintain consistency
      await handleAddComponents(["form"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ ui/
        │     ├─ tambo/
        │     │  └─ AGENTS.md
        │     ├─ form.tsx
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify warning about legacy location
      const output = logs.join("\n");
      expect(output).toContain("Found existing components in ui/");
    });

    it("should warn when components exist in both locations", async () => {
      // Setup: Project with components in both locations
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { "@tambo-ai/react": "^1.0.0" },
        }),
        ...createRegistryFiles(["message", "form"]),
        // Components in both locations
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div>UI</div>;",
        "/mock-project/src/components/tambo/form.tsx":
          "export const Form = () => <div>Tambo</div>;",
      });

      // Set inquirer to cancel installation
      inquirerResponses = { continueAnyway: false };

      // Execute
      await handleAddComponents(["message"]);

      // Verify warning about both locations
      const output = logs.join("\n");
      expect(output).toContain("Found components in both");
      expect(output).toContain("Installation cancelled");
    });

    it("should continue installation when user confirms mixed locations", async () => {
      // Setup: Project with components in both locations
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { "@tambo-ai/react": "^1.0.0" },
        }),
        ...createRegistryFiles(["message", "form", "graph"]),
        // Components in both locations
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div>UI</div>;",
        "/mock-project/src/components/tambo/form.tsx":
          "export const Form = () => <div>Tambo</div>;",
      });

      // Set inquirer to continue installation
      inquirerResponses = { continueAnyway: true, proceed: true };

      // Execute
      await handleAddComponents(["graph"]);

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  ├─ tambo/
        │  │  ├─ AGENTS.md
        │  │  ├─ form.tsx
        │  │  └─ graph.tsx
        │  └─ ui/
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      const output = logs.join("\n");
      expect(output).toContain("Installation complete");
    });
  });

  describe("installation options", () => {
    it("should respect --yes flag and skip prompts", async () => {
      // Setup
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message"]),
      });

      // Execute with --yes
      await handleAddComponents(["message"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      const output = logs.join("\n");
      expect(output).toContain("Auto-proceeding with installation");
    });

    it("should respect --silent flag and suppress output", async () => {
      // Setup
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
      });

      // Execute with --silent and --yes
      await handleAddComponents(["message"], { silent: true, yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);

      // Verify minimal output (silent mode)
      expect(logs.length).toBe(0);
    });

    it("should respect --installPath option", async () => {
      // Setup
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
      });

      // Execute with custom install path
      await handleAddComponents(["message"], {
        yes: true,
        installPath: "custom/path",
      });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/custom" }))
        .toMatchInlineSnapshot(`
        "custom/
        └─ path/
           ├─ tambo/
           │  └─ AGENTS.md
           └─ message.tsx"
      `);
      expect(toTreeSync(vol, { dir: "/mock-project/lib" }))
        .toMatchInlineSnapshot(`
        "lib/
        └─ utils.ts"
      `);
    });

    it("should install to exact prefix path without adding tambo subdirectory", async () => {
      // Setup
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
      });

      // Execute with prefix that ends with "tambo" - this was causing a bug
      // where it would create components/ui/tambo/tambo instead of components/ui/tambo
      await handleAddComponents(["message"], {
        yes: true,
        installPath: "components/ui/tambo",
        isExplicitPrefix: true,
      });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/components" }))
        .toMatchInlineSnapshot(`
        "components/
        └─ ui/
           └─ tambo/
              ├─ AGENTS.md
              └─ message.tsx"
      `);
      expect(toTreeSync(vol, { dir: "/mock-project/lib" }))
        .toMatchInlineSnapshot(`
        "lib/
        └─ utils.ts"
      `);
    });

    it("should respect --forceUpdate option and overwrite existing files", async () => {
      // Setup: Project with existing component
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { "@tambo-ai/react": "^1.0.0" },
        }),
        ...createRegistryFiles(["message"]),
        // Override message content to have "Updated"
        "/mock-project/cli/dist/registry/components/message/message.tsx":
          "export const Message = () => <div>Updated</div>;",
        // Existing component with different content
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div>Old</div>;",
      });

      // Execute with --forceUpdate
      await handleAddComponents(["message"], { yes: true, forceUpdate: true });

      // Verify file was updated
      const content = vol.readFileSync(
        "/mock-project/src/components/tambo/message.tsx",
        "utf-8",
      ) as string;
      expect(content).toContain("Updated");
      expect(content).not.toContain("Old");

      const output = logs.join("\n");
      expect(output).toContain("Updated");
    });
  });

  describe("file operations", () => {
    it("should create lib/utils.ts if it doesn't exist", async () => {
      // Setup
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ message.tsx
        └─ lib/
           └─ utils.ts"
      `);
      const utilsContent = vol.readFileSync(
        "/mock-project/src/lib/utils.ts",
        "utf-8",
      ) as string;
      expect(utilsContent).toContain("cn");
      expect(utilsContent).toContain("twMerge");
    });

    it("should not overwrite existing lib/utils.ts", async () => {
      // Setup: Project with existing utils
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
        // Existing custom utils
        "/mock-project/src/lib/utils.ts":
          "export const custom = () => 'custom';",
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify utils.ts was not overwritten
      const utilsContent = vol.readFileSync(
        "/mock-project/src/lib/utils.ts",
        "utf-8",
      ) as string;
      expect(utilsContent).toContain("custom");
      expect(utilsContent).not.toContain("twMerge");
    });

    it("should create nested directories as needed", async () => {
      // Setup: Component with nested file structure
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        "/mock-project/cli/dist/commands/add/utils.js": "// Utils placeholder",
        "/mock-project/cli/dist/registry/components/complex-component/config.json":
          JSON.stringify({
            name: "complex-component",
            description: "Complex component",
            dependencies: [],
            devDependencies: [],
            requires: [],
            files: [
              {
                name: "complex-component.tsx",
              },
              {
                name: "lib/helper.ts",
              },
            ],
          }),
        // Add actual component files
        "/mock-project/cli/dist/registry/components/complex-component/complex-component.tsx":
          "export const Complex = () => <div>Complex</div>;",
        "/mock-project/cli/dist/registry/components/complex-component/lib/helper.ts":
          "export const helper = () => 'helper';",
      });

      // Execute
      await handleAddComponents(["complex-component"], { yes: true });

      // Verify filesystem state
      expect(toTreeSync(vol, { dir: "/mock-project/src" }))
        .toMatchInlineSnapshot(`
        "src/
        ├─ components/
        │  └─ tambo/
        │     ├─ AGENTS.md
        │     └─ complex-component.tsx
        └─ lib/
           ├─ helper.ts
           └─ utils.ts"
      `);
    });
  });

  describe("npm dependency management", () => {
    it("should install production dependencies", async () => {
      // Setup
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message"]),
        // Override to add react-markdown dependency
        "/mock-project/cli/dist/registry/components/message/config.json":
          JSON.stringify({
            name: "message",
            description: "Message component",
            dependencies: ["@tambo-ai/react", "react-markdown"],
            devDependencies: [],
            requires: [],
            files: [
              {
                name: "message.tsx",
              },
            ],
          }),
        "/mock-project/cli/dist/registry/components/message/message.tsx":
          "export const Message = () => <div>Message</div>;",
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify npm install was called with production dependencies
      const installCalls = execSyncCalls.filter((cmd) =>
        cmd.includes("npm install"),
      );
      expect(installCalls.length).toBeGreaterThan(0);

      const prodInstall = installCalls.find(
        (cmd) => !cmd.includes("-D") && cmd.includes("@tambo-ai/react"),
      );
      expect(prodInstall).toBeDefined();
      expect(prodInstall).toContain("react-markdown");
    });

    it("should install dev dependencies", async () => {
      // Setup
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {},
        }),
        ...createRegistryFiles(["message"]),
        // Override to add dev dependency
        "/mock-project/cli/dist/registry/components/message/config.json":
          JSON.stringify({
            name: "message",
            description: "Message component",
            dependencies: [],
            devDependencies: ["@types/react"],
            requires: [],
            files: [
              {
                name: "message.tsx",
              },
            ],
          }),
        "/mock-project/cli/dist/registry/components/message/message.tsx":
          "export const Message = () => <div>Message</div>;",
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify npm install was called with dev dependencies
      const devInstalls = execSyncCalls.filter(
        (cmd) => cmd.includes("npm install -D") && cmd.includes("@types/react"),
      );
      expect(devInstalls.length).toBeGreaterThan(0);
    });

    it("should skip already installed dependencies", async () => {
      // Setup: Project with dependencies already installed
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            "@tambo-ai/react": "^1.0.0",
            "react-markdown": "^8.0.0",
          },
        }),
        ...createRegistryFiles(["message"]),
        // Override to add react-markdown dependency
        "/mock-project/cli/dist/registry/components/message/config.json":
          JSON.stringify({
            name: "message",
            description: "Message component",
            dependencies: ["@tambo-ai/react", "react-markdown"],
            devDependencies: [],
            requires: [],
            files: [
              {
                name: "message.tsx",
              },
            ],
          }),
        "/mock-project/cli/dist/registry/components/message/message.tsx":
          "export const Message = () => <div>Message</div>;",
      });

      // Execute
      await handleAddComponents(["message"], { yes: true });

      // Verify npm install was NOT called for already installed deps
      const installCalls = execSyncCalls.filter((cmd) =>
        cmd.includes("@tambo-ai/react"),
      );
      expect(installCalls.length).toBe(0);
    });

    it("should use --legacy-peer-deps when option is set", async () => {
      // Setup
      vol.fromJSON({
        ...createBasicProject(),
        ...createRegistryFiles(["message"]),
      });

      // Execute with legacyPeerDeps option
      await handleAddComponents(["message"], {
        yes: true,
        legacyPeerDeps: true,
      });

      // Verify npm install was called with --legacy-peer-deps
      const installWithLegacy = execSyncCalls.find((cmd) =>
        cmd.includes("--legacy-peer-deps"),
      );
      expect(installWithLegacy).toBeDefined();
    });
  });
});
