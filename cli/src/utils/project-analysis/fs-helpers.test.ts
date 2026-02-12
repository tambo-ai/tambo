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
const { findFilesRecursively, findFirstExisting, findDirectory } =
  await import("./fs-helpers.js");

describe("fs-helpers", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("findFilesRecursively", () => {
    it("finds .ts and .tsx files in directory", () => {
      vol.fromJSON({
        "/project/src/index.ts": "export {}",
        "/project/src/components/Button.tsx": "export const Button = () => {}",
        "/project/src/utils/helper.ts": "export function helper() {}",
        "/project/README.md": "# Project",
      });

      const result = findFilesRecursively("/project/src", [".ts", ".tsx"]);

      expect(result).toHaveLength(3);
      expect(result).toContain("/project/src/index.ts");
      expect(result).toContain("/project/src/components/Button.tsx");
      expect(result).toContain("/project/src/utils/helper.ts");
    });

    it("excludes node_modules by default", () => {
      vol.fromJSON({
        "/project/src/index.ts": "export {}",
        "/project/node_modules/some-package/index.ts": "export {}",
        "/project/node_modules/other/lib.ts": "export {}",
      });

      const result = findFilesRecursively("/project", [".ts"]);

      expect(result).toHaveLength(1);
      expect(result).toContain("/project/src/index.ts");
    });

    it("excludes .next directory by default", () => {
      vol.fromJSON({
        "/project/src/index.ts": "export {}",
        "/project/.next/cache/file.ts": "export {}",
      });

      const result = findFilesRecursively("/project", [".ts"]);

      expect(result).toHaveLength(1);
      expect(result).toContain("/project/src/index.ts");
    });

    it("excludes custom directories when specified", () => {
      vol.fromJSON({
        "/project/src/index.ts": "export {}",
        "/project/generated/output.ts": "export {}",
        "/project/temp/file.ts": "export {}",
      });

      const result = findFilesRecursively("/project", [".ts"], {
        exclude: ["generated", "temp"],
      });

      expect(result).toHaveLength(1);
      expect(result).toContain("/project/src/index.ts");
    });

    it("returns empty array when no files match", () => {
      vol.fromJSON({
        "/project/src/index.js": "export {}",
        "/project/README.md": "# Project",
      });

      const result = findFilesRecursively("/project", [".ts", ".tsx"]);

      expect(result).toHaveLength(0);
    });

    it("handles nested directory structures", () => {
      vol.fromJSON({
        "/project/src/components/ui/Button.tsx": "export {}",
        "/project/src/components/forms/Input.tsx": "export {}",
        "/project/src/lib/utils/format.ts": "export {}",
      });

      const result = findFilesRecursively("/project/src", [".ts", ".tsx"]);

      expect(result).toHaveLength(3);
    });

    it("returns empty array for non-existent directory", () => {
      const result = findFilesRecursively("/non-existent", [".ts"]);
      expect(result).toHaveLength(0);
    });
  });

  describe("findFirstExisting", () => {
    it("returns first existing file", () => {
      vol.fromJSON({
        "/project/src/App.tsx": "export {}",
        "/project/App.tsx": "export {}",
      });

      const result = findFirstExisting(["src/App.tsx", "App.tsx"], "/project");

      expect(result).toBe("/project/src/App.tsx");
    });

    it("returns second file if first doesn't exist", () => {
      vol.fromJSON({
        "/project/App.tsx": "export {}",
      });

      const result = findFirstExisting(["src/App.tsx", "App.tsx"], "/project");

      expect(result).toBe("/project/App.tsx");
    });

    it("returns null when no files exist", () => {
      vol.fromJSON({
        "/project/other.tsx": "export {}",
      });

      const result = findFirstExisting(["src/App.tsx", "App.tsx"], "/project");

      expect(result).toBeNull();
    });

    it("ignores directories with same name as file", () => {
      vol.mkdirSync("/project/src/App.tsx", { recursive: true });
      vol.fromJSON({
        "/project/App.tsx": "",
      });

      const result = findFirstExisting(["src/App.tsx", "App.tsx"], "/project");

      expect(result).toBe("/project/App.tsx");
    });

    it("returns null for empty candidates array", () => {
      vol.fromJSON({
        "/project/App.tsx": "export {}",
      });

      const result = findFirstExisting([], "/project");

      expect(result).toBeNull();
    });
  });

  describe("findDirectory", () => {
    it("returns first existing directory", () => {
      vol.fromJSON({
        "/project/src/app/page.tsx": "export {}",
        "/project/app/page.tsx": "export {}",
      });

      const result = findDirectory(["src/app", "app"], "/project");

      expect(result).toBe("/project/src/app");
    });

    it("returns second directory if first doesn't exist", () => {
      vol.fromJSON({
        "/project/app/page.tsx": "export {}",
      });

      const result = findDirectory(["src/app", "app"], "/project");

      expect(result).toBe("/project/app");
    });

    it("returns null when no directories exist", () => {
      vol.fromJSON({
        "/project/other/file.tsx": "export {}",
      });

      const result = findDirectory(["src/app", "app"], "/project");

      expect(result).toBeNull();
    });

    it("ignores files with same name as directory", () => {
      vol.fromJSON({
        "/project/app": "this is a file",
        "/project/pages/index.tsx": "export {}",
      });

      const result = findDirectory(["app", "pages"], "/project");

      expect(result).toBe("/project/pages");
    });

    it("returns null for empty candidates array", () => {
      vol.fromJSON({
        "/project/app/page.tsx": "export {}",
      });

      const result = findDirectory([], "/project");

      expect(result).toBeNull();
    });
  });
});
