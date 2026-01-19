import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { mockFs, resetMocks } from "../__fixtures__/test-utils.js";
import { detectFramework, getGlobalsCssLocations, findOrGetGlobalsCssPath } from "./framework-detection.js";

describe("framework-detection", () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  describe("detectFramework", () => {
    it("detects Next.js by package", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { next: "^14.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("next");
      expect(result?.envPrefix).toBe("NEXT_PUBLIC_");
    });

    it("detects Next.js by config file", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: {} }),
        "next.config.ts": "export default {}",
      });

      const result = detectFramework();
      expect(result?.name).toBe("next");
    });

    it("detects Vite by package", () => {
      mockFs({
        "package.json": JSON.stringify({ devDependencies: { vite: "^5.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("vite");
      expect(result?.envPrefix).toBe("VITE_");
    });

    it("detects Vite by config file", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: {} }),
        "vite.config.ts": "export default {}",
      });

      const result = detectFramework();
      expect(result?.name).toBe("vite");
    });

    it("detects Remix by package", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "@remix-run/react": "^2.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("remix");
      expect(result?.envPrefix).toBeNull(); // Remix uses server-side env
    });

    it("detects Remix by @remix-run/node package", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "@remix-run/node": "^2.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("remix");
    });

    it("detects React Router 7 by package and config", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "react-router": "^7.0.0" } }),
        "react-router.config.ts": "export default {}",
      });

      const result = detectFramework();
      expect(result?.name).toBe("react-router");
      expect(result?.envPrefix).toBe("VITE_"); // Uses Vite under the hood
    });

    it("does not detect React Router 7 without config file", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "react-router": "^7.0.0" } }),
      });

      // React Router without config falls through - it's just react-router as library
      const result = detectFramework();
      expect(result?.name).not.toBe("react-router");
    });

    it("detects Astro by package", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { astro: "^4.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("astro");
      expect(result?.envPrefix).toBe("PUBLIC_");
    });

    it("detects Create React App by react-scripts", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "react-scripts": "^5.0.0" } }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("cra");
      expect(result?.envPrefix).toBe("REACT_APP_");
    });

    it("returns null when no framework detected", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { react: "^18.0.0" } }),
      });

      const result = detectFramework();
      expect(result).toBeNull();
    });

    it("prioritizes Next.js over Vite when both present", () => {
      mockFs({
        "package.json": JSON.stringify({
          dependencies: { next: "^14.0.0" },
          devDependencies: { vite: "^5.0.0" },
        }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("next");
    });

    it("prioritizes Remix over Vite when both present", () => {
      mockFs({
        "package.json": JSON.stringify({
          dependencies: { "@remix-run/react": "^2.0.0" },
          devDependencies: { vite: "^5.0.0" },
        }),
      });

      const result = detectFramework();
      expect(result?.name).toBe("remix");
    });
  });

  describe("getGlobalsCssLocations", () => {
    it("returns Next.js paths with src directory", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { next: "^14.0.0" } }),
        src: "", // Just needs to exist
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("src/app/globals.css");
      expect(locations.searchPaths).toContain("src/app/globals.css");
    });

    it("returns Next.js paths without src directory", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { next: "^14.0.0" } }),
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("app/globals.css");
    });

    it("returns Vite paths with src directory", () => {
      mockFs({
        "package.json": JSON.stringify({ devDependencies: { vite: "^5.0.0" } }),
        src: "",
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("src/index.css");
      expect(locations.searchPaths).toContain("src/index.css");
    });

    it("returns Remix paths", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "@remix-run/react": "^2.0.0" } }),
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("app/tailwind.css");
    });

    it("returns Astro paths", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { astro: "^4.0.0" } }),
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("src/styles/global.css");
    });

    it("returns React Router 7 paths", () => {
      mockFs({
        "package.json": JSON.stringify({ dependencies: { "react-router": "^7.0.0" } }),
        "react-router.config.ts": "export default {}",
      });

      const locations = getGlobalsCssLocations();
      expect(locations.defaultPath).toBe("app/app.css");
    });
  });

  describe("findOrGetGlobalsCssPath", () => {
    it("returns existing CSS file if found", () => {
      mockFs({
        "package.json": JSON.stringify({ devDependencies: { vite: "^5.0.0" } }),
        src: "",
        "src/index.css": "/* styles */",
      });

      const result = findOrGetGlobalsCssPath();
      expect(result).toBe("src/index.css");
    });

    it("returns default path when no CSS file exists", () => {
      mockFs({
        "package.json": JSON.stringify({ devDependencies: { vite: "^5.0.0" } }),
        src: "",
      });

      const result = findOrGetGlobalsCssPath();
      expect(result).toBe("src/index.css");
    });

    it("returns first matching CSS file from search paths", () => {
      mockFs({
        "package.json": JSON.stringify({ devDependencies: { vite: "^5.0.0" } }),
        src: "",
        "src/App.css": "/* app styles */",
      });

      const result = findOrGetGlobalsCssPath();
      // src/index.css doesn't exist, so it should find src/App.css
      expect(result).toBe("src/App.css");
    });
  });
});
