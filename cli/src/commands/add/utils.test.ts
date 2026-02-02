import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";
import path from "path";
import { fileURLToPath } from "url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const distRegistryPath = path.join(testDir, "../../registry");

// Mock fs module before importing the utilities
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Import after mocking
const {
  getRegistryBasePath,
  getRegistryPath,
  getConfigPath,
  componentExists,
  getComponentList,
  getTamboComponentInfo,
  getKnownComponentNames,
  checkLegacyComponents,
  getInstalledComponents,
} = await import("./utils.js");

describe("Registry Utilities", () => {
  let originalCwd: () => string;
  let originalRegistryPath: string | undefined;

  beforeEach(() => {
    vol.reset();
    originalCwd = process.cwd;
    originalRegistryPath = process.env.TAMBO_REGISTRY_PATH;
    process.cwd = () => "/mock-project";
    delete process.env.TAMBO_REGISTRY_PATH;
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;

    if (originalRegistryPath === undefined) {
      delete process.env.TAMBO_REGISTRY_PATH;
    } else {
      process.env.TAMBO_REGISTRY_PATH = originalRegistryPath;
    }
  });

  describe("getRegistryBasePath", () => {
    it("uses TAMBO_REGISTRY_PATH env var when set and valid", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getRegistryBasePath();
      expect(result).toBe("/custom/registry");
    });

    it("throws when TAMBO_REGISTRY_PATH points to invalid directory", () => {
      vol.fromJSON({
        "/custom/registry/invalid.txt": "not a registry",
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      expect(() => getRegistryBasePath()).toThrow(
        "Invalid TAMBO_REGISTRY_PATH",
      );
    });

    it("throws when no registry found", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({ name: "test" }),
      });

      expect(() => getRegistryBasePath()).toThrow("Registry not found");
    });
  });

  describe("getRegistryPath", () => {
    it("returns path to component in registry", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getRegistryPath("message");
      expect(result).toBe("/custom/registry/components/message");
    });
  });

  describe("getConfigPath", () => {
    it("returns path to component config.json", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getConfigPath("message");
      expect(result).toBe("/custom/registry/components/message/config.json");
    });
  });

  describe("componentExists", () => {
    beforeEach(() => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          description: "Message component",
        }),
        "/custom/registry/components/invalid/config.json": "not valid json{",
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";
    });

    it("returns true when component exists with valid config", () => {
      expect(componentExists("message")).toBe(true);
    });

    it("returns false when component does not exist", () => {
      expect(componentExists("nonexistent")).toBe(false);
    });

    it("returns false when config.json is malformed", () => {
      expect(componentExists("invalid")).toBe(false);
    });
  });

  describe("getComponentList", () => {
    it("returns list of components with descriptions", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          description: "A message component",
          componentName: "Message",
        }),
        "/custom/registry/components/form/config.json": JSON.stringify({
          name: "form",
          description: "A form component",
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getComponentList();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        name: "message",
        description: "A message component",
        componentName: "Message",
      });
      expect(result).toContainEqual({
        name: "form",
        description: "A form component",
        componentName: "form",
      });
    });

    it("returns empty array when components directory does not exist", () => {
      vol.fromJSON({
        [`${distRegistryPath}/.gitkeep`]: "",
      });

      expect(
        memfsFs.existsSync(path.join(distRegistryPath, "components")),
      ).toBe(false);

      const result = getComponentList();
      expect(result).toEqual([]);
    });

    it("returns empty array when components directory exists but contains no component dirs", () => {
      vol.fromJSON({
        [`${distRegistryPath}/components/.gitkeep`]: "",
      });

      const result = getComponentList();
      expect(result).toEqual([]);
    });

    it("skips components without config.json", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          description: "A message component",
        }),
        "/custom/registry/components/broken/readme.md": "No config here",
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getComponentList();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("message");
    });
  });

  describe("getTamboComponentInfo", () => {
    it("returns main and support components", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          description: "Message component",
          files: [
            { name: "message.tsx" },
            { name: "message-bubble.tsx" }, // Support component
          ],
        }),
        "/custom/registry/components/form/config.json": JSON.stringify({
          name: "form",
          description: "Form component",
          files: [{ name: "form.tsx" }],
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getTamboComponentInfo();

      expect(result.mainComponents.has("message")).toBe(true);
      expect(result.mainComponents.has("form")).toBe(true);
      expect(result.supportComponents.has("message-bubble")).toBe(true);
      expect(result.allComponents.has("message")).toBe(true);
      expect(result.allComponents.has("form")).toBe(true);
      expect(result.allComponents.has("message-bubble")).toBe(true);
    });

    it("returns empty sets when registry is empty", () => {
      vol.fromJSON({
        "/custom/registry/components/.gitkeep": "",
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getTamboComponentInfo();

      expect(result.mainComponents.size).toBe(0);
      expect(result.supportComponents.size).toBe(0);
      expect(result.allComponents.size).toBe(0);
    });
  });

  describe("getKnownComponentNames", () => {
    it("returns set of all component names", () => {
      vol.fromJSON({
        "/custom/registry/components/message/config.json": JSON.stringify({
          name: "message",
          files: [{ name: "message.tsx" }],
        }),
        "/custom/registry/components/form/config.json": JSON.stringify({
          name: "form",
          files: [{ name: "form.tsx" }],
        }),
      });
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      const result = getKnownComponentNames();

      expect(result.has("message")).toBe(true);
      expect(result.has("form")).toBe(true);
    });
  });

  describe("checkLegacyComponents", () => {
    it("returns path when legacy components exist", () => {
      vol.fromJSON({
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = checkLegacyComponents("src/components");
      expect(result).toBe("/mock-project/src/components/ui");
    });

    it("returns null when no legacy components", () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = checkLegacyComponents("src/components");
      expect(result).toBeNull();
    });

    it("returns null when legacy directory exists but has no .tsx files", () => {
      vol.fromJSON({
        "/mock-project/src/components/ui/readme.md": "# UI Components",
      });

      const result = checkLegacyComponents("src/components");
      expect(result).toBeNull();
    });
  });

  describe("getInstalledComponents", () => {
    const registryFiles = Object.freeze({
      "/custom/registry/components/message/config.json": JSON.stringify({
        name: "message",
        files: [{ name: "message.tsx" }],
      }),
      "/custom/registry/components/form/config.json": JSON.stringify({
        name: "form",
        files: [{ name: "form.tsx" }],
      }),
      "/custom/registry/components/graph/config.json": JSON.stringify({
        name: "graph",
        files: [{ name: "graph.tsx" }],
      }),
    } satisfies Record<string, string>);

    let previousRegistryPath: string | undefined;

    beforeEach(() => {
      vol.reset();

      previousRegistryPath = process.env.TAMBO_REGISTRY_PATH;
      process.env.TAMBO_REGISTRY_PATH = "/custom/registry";

      vol.fromJSON(registryFiles);
    });

    afterEach(() => {
      if (previousRegistryPath === undefined) {
        delete process.env.TAMBO_REGISTRY_PATH;
      } else {
        process.env.TAMBO_REGISTRY_PATH = previousRegistryPath;
      }
    });

    it("finds components in tambo/ location", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/src/components/tambo/form.tsx":
          "export const Form = () => <div />;",
      });

      const result = await getInstalledComponents("src/components");
      expect(result).toContain("message");
      expect(result).toContain("form");
    });

    it("finds components in ui/ legacy location", async () => {
      vol.fromJSON({
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = await getInstalledComponents("src/components");
      expect(result).toContain("message");
    });

    it("deduplicates components across locations", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/src/components/ui/message.tsx":
          "export const Message = () => <div />;",
      });

      const result = await getInstalledComponents("src/components");
      const messageCount = result.filter((c) => c === "message").length;
      expect(messageCount).toBe(1);
    });

    it("respects isExplicitPrefix flag", async () => {
      vol.fromJSON({
        "/mock-project/custom/path/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/custom/path/ui/form.tsx":
          "export const Form = () => <div />;",
      });

      const result = await getInstalledComponents("custom/path", true);
      expect(result).toContain("message");
      // ui/ is not checked when isExplicitPrefix is true
      expect(result).not.toContain("form");
    });

    it("only returns known registry components", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/message.tsx":
          "export const Message = () => <div />;",
        "/mock-project/src/components/tambo/custom-component.tsx":
          "export const Custom = () => <div />;",
      });

      const result = await getInstalledComponents("src/components");
      expect(result).toContain("message");
      expect(result).not.toContain("custom-component");
    });

    it("returns empty array when no components installed", async () => {
      vol.fromJSON({
        "/mock-project/src/components/tambo/.gitkeep": "",
      });

      const result = await getInstalledComponents("src/components");
      expect(result).toEqual([]);
    });
  });
});
