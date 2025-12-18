import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { vol } from "memfs";
import { detectFramework } from "./framework-detection.js";

// Mock fs module
jest.mock("fs");

describe("detectFramework", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("config file detection", () => {
    it("detects Next.js from next.config.js", () => {
      vol.fromJSON({
        "/project/next.config.js": "module.exports = {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("nextjs");
      expect(result.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("detects Next.js from next.config.ts", () => {
      vol.fromJSON({
        "/project/next.config.ts": "export default {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("nextjs");
      expect(result.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("detects Vite from vite.config.js", () => {
      vol.fromJSON({
        "/project/vite.config.js": "export default {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("vite");
      expect(result.envPrefix).toBe("VITE_");
    });

    it("detects Astro from astro.config.mjs", () => {
      vol.fromJSON({
        "/project/astro.config.mjs": "export default {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("astro");
      expect(result.envPrefix).toBe("PUBLIC_");
    });

    it("detects SvelteKit from svelte.config.js", () => {
      vol.fromJSON({
        "/project/svelte.config.js": "export default {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("sveltekit");
      expect(result.envPrefix).toBe("PUBLIC_");
    });

    it("detects Remix from remix.config.js", () => {
      vol.fromJSON({
        "/project/remix.config.js": "module.exports = {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("remix");
      expect(result.envPrefix).toBe("");
    });

    it("detects Nuxt from nuxt.config.js", () => {
      vol.fromJSON({
        "/project/nuxt.config.js": "export default {}",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("nuxt");
      expect(result.envPrefix).toBe("NUXT_PUBLIC_");
    });
  });

  describe("package.json detection", () => {
    it("detects Next.js from package.json dependencies", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
          },
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("nextjs");
      expect(result.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("detects Vite from package.json devDependencies", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          devDependencies: {
            vite: "^5.0.0",
          },
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("vite");
      expect(result.envPrefix).toBe("VITE_");
    });

    it("detects CRA from react-scripts", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          dependencies: {
            "react-scripts": "^5.0.0",
          },
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("cra");
      expect(result.envPrefix).toBe("REACT_APP_");
    });

    it("detects Remix from @remix-run/react", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          dependencies: {
            "@remix-run/react": "^2.0.0",
          },
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("remix");
      expect(result.envPrefix).toBe("");
    });
  });

  describe("priority and fallback", () => {
    it("prioritizes config files over package.json", () => {
      vol.fromJSON({
        "/project/next.config.js": "module.exports = {}",
        "/project/package.json": JSON.stringify({
          dependencies: {
            vite: "^5.0.0",
          },
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("nextjs");
      expect(result.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("returns unknown for empty project", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          name: "test-project",
        }),
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("unknown");
      expect(result.envPrefix).toBe("");
    });

    it("returns unknown when no package.json exists", () => {
      vol.fromJSON({
        "/project/index.js": "console.log('hello')",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("unknown");
      expect(result.envPrefix).toBe("");
    });

    it("handles invalid package.json gracefully", () => {
      vol.fromJSON({
        "/project/package.json": "invalid json {{{",
      });

      const result = detectFramework("/project");
      expect(result.framework).toBe("unknown");
      expect(result.envPrefix).toBe("");
    });
  });
});
