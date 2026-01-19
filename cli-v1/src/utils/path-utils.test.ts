import { describe, expect, it } from "@jest/globals";
import path from "path";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
  getComponentFilePath,
  getLibDirectory,
  resolveComponentPaths,
} from "./path-utils.js";

describe("path-utils", () => {
  const projectRoot = "/project";

  describe("getComponentDirectoryPath", () => {
    describe("with explicit prefix", () => {
      it("returns resolved path for relative installPath", () => {
        const result = getComponentDirectoryPath(
          projectRoot,
          "src/components",
          true,
        );
        expect(result).toBe(path.resolve(projectRoot, "src/components"));
      });

      it("throws when path escapes project root with ..", () => {
        expect(() =>
          getComponentDirectoryPath(projectRoot, "../outside", true),
        ).toThrow(/must be within the project root/);
      });

      it("allows nested paths within project", () => {
        const result = getComponentDirectoryPath(
          projectRoot,
          "src/deep/nested/path",
          true,
        );
        expect(result).toBe(path.resolve(projectRoot, "src/deep/nested/path"));
      });
    });

    describe("without explicit prefix", () => {
      it("appends component subdir to install path", () => {
        const result = getComponentDirectoryPath(projectRoot, "src", false);
        // COMPONENT_SUBDIR is "tambo" - appended directly to installPath
        expect(result).toBe(path.resolve(projectRoot, "src", "tambo"));
      });

      it("throws when computed path escapes project root", () => {
        expect(() =>
          getComponentDirectoryPath(projectRoot, "../../outside", false),
        ).toThrow(/escapes the project root/);
      });
    });
  });

  describe("getLegacyComponentDirectoryPath", () => {
    it("returns legacy component path", () => {
      const result = getLegacyComponentDirectoryPath(projectRoot, "src");
      // LEGACY_COMPONENT_SUBDIR is "ui" - appended directly to installPath
      expect(result).toBe(path.join(projectRoot, "src", "ui"));
    });

    it("handles nested install paths", () => {
      const result = getLegacyComponentDirectoryPath(
        projectRoot,
        "app/frontend",
      );
      expect(result).toBe(path.join(projectRoot, "app/frontend", "ui"));
    });
  });

  describe("getComponentFilePath", () => {
    it("returns component file path with .tsx extension", () => {
      const result = getComponentFilePath("/project/components", "button");
      expect(result).toBe(path.join("/project/components", "button.tsx"));
    });

    it("handles component names with hyphens", () => {
      const result = getComponentFilePath(
        "/project/components",
        "message-input",
      );
      expect(result).toBe(
        path.join("/project/components", "message-input.tsx"),
      );
    });
  });

  describe("getLibDirectory", () => {
    describe("with explicit prefix", () => {
      it("returns src/lib when install path is in src", () => {
        const result = getLibDirectory(projectRoot, "src/components", true);
        expect(result).toBe(path.join(projectRoot, "src", "lib"));
      });

      it("returns src/lib when install path is exactly src", () => {
        const result = getLibDirectory(projectRoot, "src", true);
        expect(result).toBe(path.join(projectRoot, "src", "lib"));
      });

      it("returns lib when install path is not in src", () => {
        const result = getLibDirectory(projectRoot, "components", true);
        expect(result).toBe(path.join(projectRoot, "lib"));
      });

      it("handles absolute install path", () => {
        const absolutePath = path.resolve(projectRoot, "src/components");
        const result = getLibDirectory(projectRoot, absolutePath, true);
        expect(result).toBe(path.join(projectRoot, "src", "lib"));
      });
    });

    describe("without explicit prefix", () => {
      it("returns lib in parent directory", () => {
        const result = getLibDirectory(projectRoot, "src/components", false);
        expect(result).toBe(path.join(projectRoot, "src", "lib"));
      });

      it("returns lib at project root when install path has no parent", () => {
        const result = getLibDirectory(projectRoot, "components", false);
        expect(result).toBe(path.join(projectRoot, "lib"));
      });

      it("returns lib at project root for empty parent", () => {
        const result = getLibDirectory(projectRoot, ".", false);
        expect(result).toBe(path.join(projectRoot, "lib"));
      });
    });
  });

  describe("resolveComponentPaths", () => {
    it("returns new and legacy paths when not explicit prefix", () => {
      const result = resolveComponentPaths(projectRoot, "src", "button", false);

      expect(result.newPath).toBe(
        path.join(projectRoot, "src", "tambo", "button.tsx"),
      );
      expect(result.legacyPath).toBe(
        path.join(projectRoot, "src", "ui", "button.tsx"),
      );
    });

    it("returns only new path when explicit prefix", () => {
      const result = resolveComponentPaths(
        projectRoot,
        "src/custom",
        "button",
        true,
      );

      expect(result.newPath).toBe(
        path.join(projectRoot, "src", "custom", "button.tsx"),
      );
      expect(result.legacyPath).toBeNull();
    });

    it("handles component names correctly", () => {
      const result = resolveComponentPaths(
        projectRoot,
        "src",
        "message-input",
        false,
      );

      expect(result.newPath).toContain("message-input.tsx");
      expect(result.legacyPath).toContain("message-input.tsx");
    });
  });
});
