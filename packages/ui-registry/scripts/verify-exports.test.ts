import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

// Mock fs module before importing the validation functions
jest.unstable_mockModule("node:fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Import validation functions after mocking
const {
  extractComponentFromPath,
  extractRelativeImports,
  getComponentDirectories,
  getComponentNames,
  getPackageExports,
  validateComponentRequires,
  validateRelativeImports,
  verifyComponentsHaveExports,
  verifyExportsPointToFiles,
} = await import("./verify-exports.lib.js");

describe("verify-exports", () => {
  const PACKAGE_ROOT = "/mock-package";
  const COMPONENTS_DIR = "/mock-package/src/components";

  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  // ==========================================================================
  // Export Verification Tests
  // ==========================================================================

  describe("getPackageExports", () => {
    it("returns exports from package.json", () => {
      vol.fromJSON({
        [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({
          name: "test-package",
          exports: {
            "./utils": "./src/utils.ts",
            "./components/foo": "./src/components/foo/index.tsx",
          },
        }),
      });

      const exports = getPackageExports(PACKAGE_ROOT);
      expect(exports.get("./utils")).toBe("./src/utils.ts");
      expect(exports.get("./components/foo")).toBe(
        "./src/components/foo/index.tsx",
      );
    });

    it("throws when no exports field", () => {
      vol.fromJSON({
        [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({
          name: "test-package",
        }),
      });

      expect(() => getPackageExports(PACKAGE_ROOT)).toThrow(
        "No exports field found",
      );
    });
  });

  describe("getComponentDirectories", () => {
    it("returns all component directories", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/foo/index.tsx`]: "export const Foo = () => null;",
        [`${COMPONENTS_DIR}/bar/index.tsx`]: "export const Bar = () => null;",
      });

      const dirs = getComponentDirectories(COMPONENTS_DIR);
      expect(dirs).toContain("foo");
      expect(dirs).toContain("bar");
      expect(dirs).toHaveLength(2);
    });

    it("returns empty array when directory does not exist", () => {
      vol.fromJSON({});

      const dirs = getComponentDirectories(COMPONENTS_DIR);
      expect(dirs).toHaveLength(0);
    });
  });

  describe("verifyExportsPointToFiles", () => {
    it("returns no errors when all exports exist", () => {
      vol.fromJSON({
        [`${PACKAGE_ROOT}/src/utils.ts`]: "export const util = () => {};",
        [`${PACKAGE_ROOT}/src/components/foo/index.tsx`]:
          "export const Foo = () => null;",
      });

      const exports = new Map([
        ["./utils", "./src/utils.ts"],
        ["./components/foo", "./src/components/foo/index.tsx"],
      ]);

      const errors = verifyExportsPointToFiles(exports, PACKAGE_ROOT);
      expect(errors).toHaveLength(0);
    });

    it("returns error for missing files", () => {
      vol.fromJSON({
        [`${PACKAGE_ROOT}/src/utils.ts`]: "export const util = () => {};",
      });

      const exports = new Map([
        ["./utils", "./src/utils.ts"],
        ["./components/missing", "./src/components/missing/index.tsx"],
      ]);

      const errors = verifyExportsPointToFiles(exports, PACKAGE_ROOT);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("./components/missing");
      expect(errors[0]).toContain("non-existent");
    });

    it("skips ./base/* export", () => {
      vol.fromJSON({});

      const exports = new Map([["./base/*", "./src/base/*/index.tsx"]]);

      const errors = verifyExportsPointToFiles(exports, PACKAGE_ROOT);
      expect(errors).toHaveLength(0);
    });
  });

  describe("verifyComponentsHaveExports", () => {
    it("returns no errors when all components have exports", () => {
      const exports = new Map([
        ["./components/foo", "./src/components/foo/index.tsx"],
        ["./components/bar", "./src/components/bar/index.tsx"],
      ]);

      const errors = verifyComponentsHaveExports(exports, ["foo", "bar"]);
      expect(errors).toHaveLength(0);
    });

    it("returns error for missing exports", () => {
      const exports = new Map([
        ["./components/foo", "./src/components/foo/index.tsx"],
      ]);

      const errors = verifyComponentsHaveExports(exports, ["foo", "bar"]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("bar");
      expect(errors[0]).toContain("no corresponding export");
    });
  });

  // ==========================================================================
  // Component Requires Verification Tests
  // ==========================================================================

  describe("extractComponentFromPath", () => {
    it("extracts component name from legacy src/registry/ path", () => {
      const result = extractComponentFromPath(
        "src/registry/message-suggestions/suggestions-tooltip.tsx",
        "message-input",
      );
      expect(result).toBe("message-suggestions");
    });

    it("extracts component name from components/ path", () => {
      const result = extractComponentFromPath(
        "components/message-suggestions/suggestions-tooltip.tsx",
        "message-input",
      );
      expect(result).toBe("message-suggestions");
    });

    it("returns null for lib/ paths", () => {
      const result = extractComponentFromPath(
        "src/registry/lib/utils.ts",
        "message-input",
      );
      expect(result).toBeNull();
    });

    it("returns null for base/ paths", () => {
      const result = extractComponentFromPath(
        "src/registry/base/message.tsx",
        "message-input",
      );
      expect(result).toBeNull();
    });

    it("returns null for same component reference", () => {
      const result = extractComponentFromPath(
        "src/registry/message-input/helper.tsx",
        "message-input",
      );
      expect(result).toBeNull();
    });

    it("returns null for non-registry paths", () => {
      const result = extractComponentFromPath("file.tsx", "message-input");
      expect(result).toBeNull();
    });
  });

  describe("getComponentNames", () => {
    it("returns all component names from registry", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
        }),
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
        }),
      });

      const result = getComponentNames(COMPONENTS_DIR);
      expect(result.has("component-a")).toBe(true);
      expect(result.has("component-b")).toBe(true);
      expect(result.size).toBe(2);
    });

    it("ignores directories without config.json", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
        }),
        [`${COMPONENTS_DIR}/broken/readme.md`]: "# Broken component",
      });

      const result = getComponentNames(COMPONENTS_DIR);
      expect(result.has("component-a")).toBe(true);
      expect(result.has("broken")).toBe(false);
      expect(result.size).toBe(1);
    });

    it("returns empty set when components directory does not exist", () => {
      vol.fromJSON({});

      const result = getComponentNames(COMPONENTS_DIR);
      expect(result.size).toBe(0);
    });
  });

  describe("validateComponentRequires", () => {
    it("returns no errors when requires are correctly specified", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: ["component-b"],
          files: [
            { name: "component-a.tsx" },
            {
              name: "shared.tsx",
              content: "src/registry/component-b/shared.tsx",
            },
          ],
        }),
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
          requires: [],
          files: [{ name: "component-b.tsx" }],
        }),
      });

      const knownComponents = new Set(["component-a", "component-b"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(0);
    });

    it("returns error when requires is missing a referenced component", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [
            { name: "component-a.tsx" },
            {
              name: "shared.tsx",
              content: "src/registry/component-b/shared.tsx",
            },
          ],
        }),
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
          requires: [],
          files: [{ name: "component-b.tsx" }],
        }),
      });

      const knownComponents = new Set(["component-a", "component-b"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        component: "component-a",
        referencedComponent: "component-b",
        file: "shared.tsx",
      });
    });

    it("returns multiple errors for multiple missing requires", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [
            { name: "component-a.tsx" },
            {
              name: "from-b.tsx",
              content: "src/registry/component-b/file.tsx",
            },
            {
              name: "from-c.tsx",
              content: "src/registry/component-c/file.tsx",
            },
          ],
        }),
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
          requires: [],
          files: [{ name: "component-b.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-c/config.json`]: JSON.stringify({
          name: "component-c",
          requires: [],
          files: [{ name: "component-c.tsx" }],
        }),
      });

      const knownComponents = new Set([
        "component-a",
        "component-b",
        "component-c",
      ]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(2);
    });

    it("ignores references to unknown components", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [
            { name: "component-a.tsx" },
            {
              name: "external.tsx",
              content: "src/registry/external-lib/file.tsx",
            },
          ],
        }),
      });

      // external-lib is NOT in knownComponents
      const knownComponents = new Set(["component-a"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(0);
    });

    it("ignores files without content path", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [
            { name: "component-a.tsx" }, // No content field
          ],
        }),
      });

      const knownComponents = new Set(["component-a"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(0);
    });

    it("detects missing requires from package imports", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { ComponentB } from '@tambo-ai/ui-registry/components/component-b';
          export const A = () => <ComponentB />;
        `,
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
          requires: [],
          files: [{ name: "component-b.tsx" }],
        }),
      });

      const knownComponents = new Set(["component-a", "component-b"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toEqual([
        {
          component: "component-a",
          referencedComponent: "component-b",
          file: "component-a.tsx",
        },
      ]);
    });

    it("detects missing requires from cross-component relative imports", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          requires: [],
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { helper } from '../component-b/helper';
          export const A = () => helper();
        `,
        [`${COMPONENTS_DIR}/component-b/config.json`]: JSON.stringify({
          name: "component-b",
          requires: [],
          files: [{ name: "component-b.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-b/helper.ts`]: `export const helper = () => {};`,
      });

      const knownComponents = new Set(["component-a", "component-b"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toEqual([
        {
          component: "component-a",
          referencedComponent: "component-b",
          file: "component-a.tsx",
        },
      ]);
    });

    it("returns empty array when config does not exist", () => {
      vol.fromJSON({});

      const knownComponents = new Set(["component-a"]);
      const errors = validateComponentRequires(
        "component-a",
        knownComponents,
        COMPONENTS_DIR,
      );
      expect(errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Relative Import Verification Tests
  // ==========================================================================

  describe("extractRelativeImports", () => {
    it("extracts simple relative imports", () => {
      const content = `import { Foo } from './foo';`;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo"]);
    });

    it("extracts multiple relative imports", () => {
      const content = `
        import { Foo } from './foo';
        import { Bar } from '../bar';
        import { Baz } from './nested/baz';
      `;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo", "../bar", "./nested/baz"]);
    });

    it("extracts side-effect imports", () => {
      const content = `
        import './side-effect';
        import { Foo } from './foo';
      `;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./side-effect", "./foo"]);
    });

    it("extracts export-from paths", () => {
      const content = `
        export * from './foo';
        export { Bar } from '../bar';
      `;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo", "../bar"]);
    });

    it("extracts dynamic imports", () => {
      const content = `
        const mod = await import('./foo');
        export const x = mod.x;
      `;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo"]);
    });

    it("ignores package imports", () => {
      const content = `
        import React from 'react';
        import { Foo } from './foo';
        import { something } from '@tambo-ai/react';
      `;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo"]);
    });

    it("handles type imports", () => {
      const content = `import type { FooType } from './foo';`;
      const result = extractRelativeImports(content);
      expect(result).toEqual(["./foo"]);
    });

    it("returns empty array for content without relative imports", () => {
      const content = `import React from 'react';`;
      const result = extractRelativeImports(content);
      expect(result).toEqual([]);
    });
  });

  describe("validateRelativeImports", () => {
    it("returns no errors when all imports resolve", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { helper } from './helper';
          export const A = () => <div />;
        `,
        [`${COMPONENTS_DIR}/component-a/helper.ts`]: `export const helper = () => {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("returns error when import cannot be resolved", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { missing } from './nonexistent';
          export const A = () => <div />;
        `,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        component: "component-a",
        file: "component-a.tsx",
        importPath: "./nonexistent",
      });
    });

    it("resolves imports with extensions", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { helper } from './helper';
        `,
        [`${COMPONENTS_DIR}/component-a/helper.tsx`]: `export const helper = () => {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("resolves ESM-style .js imports to TS sources", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { helper } from './helper.js';
        `,
        [`${COMPONENTS_DIR}/component-a/helper.ts`]: `export const helper = () => {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("validates export-from edges", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          export * from './helper';
        `,
        [`${COMPONENTS_DIR}/component-a/helper.ts`]: `export const helper = () => {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("validates dynamic import edges", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          export async function loadHelper() {
            return await import('./helper');
          }
        `,
        [`${COMPONENTS_DIR}/component-a/helper.ts`]: `export const helper = () => {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("resolves index file imports", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "component-a.tsx" }],
        }),
        [`${COMPONENTS_DIR}/component-a/component-a.tsx`]: `
          import { utils } from './utils';
        `,
        [`${COMPONENTS_DIR}/component-a/utils/index.ts`]: `export const utils = {};`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("skips non-TypeScript files", () => {
      vol.fromJSON({
        [`${COMPONENTS_DIR}/component-a/config.json`]: JSON.stringify({
          name: "component-a",
          files: [{ name: "styles.css" }],
        }),
        [`${COMPONENTS_DIR}/component-a/styles.css`]: `.foo { color: red; }`,
      });

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });

    it("returns empty array when config does not exist", () => {
      vol.fromJSON({});

      const errors = validateRelativeImports("component-a", COMPONENTS_DIR);
      expect(errors).toHaveLength(0);
    });
  });
});
