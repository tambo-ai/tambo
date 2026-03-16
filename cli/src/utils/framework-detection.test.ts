import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

// Mock fs module before importing the module under test
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Import after mocking
const {
  detectFramework,
  getEnvVarName,
  getTamboApiKeyEnvVar,
  isNativeFramework,
} = await import("./framework-detection.js");

describe("framework-detection", () => {
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

  describe("detectFramework", () => {
    it("detects Next.js via package.json dependencies", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("next");
      expect(result?.displayName).toBe("Next.js");
      expect(result?.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("detects Next.js via package.json devDependencies", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: {
            next: "^14.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("next");
    });

    it("detects Next.js via next.config.js file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            react: "^18.0.0",
          },
        }),
        "/mock-project/next.config.js": "module.exports = {};",
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("next");
    });

    it("detects Next.js via next.config.ts file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            react: "^18.0.0",
          },
        }),
        "/mock-project/next.config.ts": "export default {};",
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("next");
    });

    it("detects Next.js via next.config.mjs file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            react: "^18.0.0",
          },
        }),
        "/mock-project/next.config.mjs": "export default {};",
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("next");
    });

    it("detects Vite via package.json dependencies", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            react: "^18.0.0",
          },
          devDependencies: {
            vite: "^5.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("vite");
      expect(result?.displayName).toBe("Vite");
      expect(result?.envPrefix).toBe("VITE_");
    });

    it("detects Vite via vite.config.ts file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/vite.config.ts": "export default {};",
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("vite");
    });

    it("detects Vite via vite.config.js file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/vite.config.js": "export default {};",
      });

      const result = detectFramework();
      expect(result?.name).toBe("vite");
    });

    it("detects Vite via vite.config.mjs file", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/vite.config.mjs": "export default {};",
      });

      const result = detectFramework();
      expect(result?.name).toBe("vite");
    });

    it("detects Expo via package.json dependencies", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            expo: "~51.0.0",
            react: "^18.0.0",
            "react-native": "0.74.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("expo");
      expect(result?.displayName).toBe("Expo");
      expect(result?.envPrefix).toBe("EXPO_PUBLIC_");
    });

    it("detects Expo via app.json with expo key", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/app.json": JSON.stringify({ expo: { name: "my-app" } }),
      });

      const result = detectFramework();
      expect(result).not.toBeNull();
      expect(result?.name).toBe("expo");
    });

    it("does not detect Expo from app.json without expo key", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/app.json": JSON.stringify({ name: "some-app" }),
      });

      const result = detectFramework();
      expect(result).toBeNull();
    });

    it.each([
      "app.config.ts",
      "app.config.mts",
      "app.config.cts",
      "app.config.js",
      "app.config.mjs",
      "app.config.cjs",
    ])("detects Expo via %s file", (configFile) => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        [`/mock-project/${configFile}`]: "export default { expo: {} };",
      });

      const result = detectFramework();
      expect(result?.name).toBe("expo");
    });

    it("Next.js takes priority over Expo when both are present", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            next: "^14.0.0",
            expo: "~51.0.0",
            react: "^18.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("next");
    });

    it("Expo takes priority over Vite when both are present", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            expo: "~51.0.0",
            react: "^18.0.0",
          },
          devDependencies: {
            vite: "^5.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("expo");
    });

    it("Next.js takes priority over Vite when both are present", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
          },
          devDependencies: {
            vite: "^5.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("next");
    });

    it("returns null when no framework is detected", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: {
            react: "^18.0.0",
          },
        }),
      });

      const result = detectFramework();
      expect(result).toBeNull();
    });

    it("returns null when package.json is missing", () => {
      vol.fromJSON({
        "/mock-project/src/index.ts": "console.log('hello');",
      });

      const result = detectFramework();
      expect(result).toBeNull();
    });

    it("returns null when package.json is invalid JSON", () => {
      vol.fromJSON({
        "/mock-project/package.json": "{ invalid json }",
      });

      const result = detectFramework();
      expect(result).toBeNull();
    });
  });

  describe("getEnvVarName", () => {
    it("adds NEXT_PUBLIC_ prefix for Next.js projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
      });

      const result = getEnvVarName("TAMBO_API_KEY");
      expect(result).toBe("NEXT_PUBLIC_TAMBO_API_KEY");
    });

    it("adds EXPO_PUBLIC_ prefix for Expo projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { expo: "~51.0.0" },
        }),
      });

      const result = getEnvVarName("TAMBO_API_KEY");
      expect(result).toBe("EXPO_PUBLIC_TAMBO_API_KEY");
    });

    it("adds VITE_ prefix for Vite projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
      });

      const result = getEnvVarName("TAMBO_API_KEY");
      expect(result).toBe("VITE_TAMBO_API_KEY");
    });

    it("returns base name without prefix for non-framework projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
      });

      const result = getEnvVarName("TAMBO_API_KEY");
      expect(result).toBe("TAMBO_API_KEY");
    });

    it("works with custom base names", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
      });

      const result = getEnvVarName("CUSTOM_VAR");
      expect(result).toBe("NEXT_PUBLIC_CUSTOM_VAR");
    });
  });

  describe("getTamboApiKeyEnvVar", () => {
    it("returns NEXT_PUBLIC_TAMBO_API_KEY for Next.js projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
      });

      const result = getTamboApiKeyEnvVar();
      expect(result).toBe("NEXT_PUBLIC_TAMBO_API_KEY");
    });

    it("returns EXPO_PUBLIC_TAMBO_API_KEY for Expo projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { expo: "~51.0.0" },
        }),
      });

      const result = getTamboApiKeyEnvVar();
      expect(result).toBe("EXPO_PUBLIC_TAMBO_API_KEY");
    });

    it("returns TAMBO_API_KEY for non-framework projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { express: "^4.0.0" },
        }),
      });

      const result = getTamboApiKeyEnvVar();
      expect(result).toBe("TAMBO_API_KEY");
    });
  });

  describe("isNativeFramework", () => {
    it("returns true for Expo projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { expo: "~51.0.0" },
        }),
      });

      const framework = detectFramework();
      expect(isNativeFramework(framework)).toBe(true);
    });

    it("returns false for Next.js projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
      });

      const framework = detectFramework();
      expect(isNativeFramework(framework)).toBe(false);
    });

    it("returns false for Vite projects", () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
      });

      const framework = detectFramework();
      expect(isNativeFramework(framework)).toBe(false);
    });

    it("returns false for null framework", () => {
      expect(isNativeFramework(null)).toBe(false);
    });
  });
});
