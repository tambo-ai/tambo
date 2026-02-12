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
const { detectProjectStructure, detectTypeScriptConfig } =
  await import("./structure-detection.js");
const { detectFrameworkInfo } = await import("./framework-detection.js");

describe("structure-detection", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("detectProjectStructure", () => {
    describe("Next.js App Router", () => {
      it("detects src/app/layout.tsx as root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/src/app/layout.tsx":
            "export default function RootLayout() {}",
          "/project/src/app/page.tsx": "export default function Page() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(true);
        expect(result.srcPath).toBe("/project/src");
        expect(result.appDirPath).toBe("/project/src/app");
        expect(result.rootLayoutPath).toBe("/project/src/app/layout.tsx");
      });

      it("detects app/layout.tsx in root", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(false);
        expect(result.srcPath).toBeNull();
        expect(result.appDirPath).toBe("/project/app");
        expect(result.rootLayoutPath).toBe("/project/app/layout.tsx");
      });

      it("detects app/layout.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/app/layout.jsx": "export default function RootLayout() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/app/layout.jsx");
      });
    });

    describe("Next.js Pages Router", () => {
      it("detects pages/_app.tsx as root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/pages/_app.tsx": "export default function App() {}",
          "/project/pages/index.tsx": "export default function Home() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(false);
        expect(result.pagesDirPath).toBe("/project/pages");
        expect(result.rootLayoutPath).toBe("/project/pages/_app.tsx");
      });

      it("detects src/pages/_app.tsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/src/pages/_app.tsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(true);
        expect(result.pagesDirPath).toBe("/project/src/pages");
        expect(result.rootLayoutPath).toBe("/project/src/pages/_app.tsx");
      });

      it("detects pages/_app.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/pages/_app.jsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/pages/_app.jsx");
      });
    });

    describe("Vite", () => {
      it("detects src/App.tsx as root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/src/App.tsx": "export default function App() {}",
          "/project/src/main.tsx": "import App from './App'",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(true);
        expect(result.rootLayoutPath).toBe("/project/src/App.tsx");
      });

      it("detects App.tsx in root", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/App.tsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(false);
        expect(result.rootLayoutPath).toBe("/project/App.tsx");
      });

      it("detects src/App.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/src/App.jsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/src/App.jsx");
      });
    });

    describe("Remix", () => {
      it("detects app/root.tsx as root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { "@remix-run/react": "^2.0.0" },
          }),
          "/project/app/root.tsx": "export default function Root() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.appDirPath).toBe("/project/app");
        expect(result.rootLayoutPath).toBe("/project/app/root.tsx");
      });

      it("detects app/root.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { "@remix-run/react": "^2.0.0" },
          }),
          "/project/app/root.jsx": "export default function Root() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/app/root.jsx");
      });
    });

    describe("CRA", () => {
      it("detects src/App.tsx as root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { "react-scripts": "^5.0.0" },
          }),
          "/project/src/App.tsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.hasSrcDir).toBe(true);
        expect(result.rootLayoutPath).toBe("/project/src/App.tsx");
      });

      it("detects src/App.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { "react-scripts": "^5.0.0" },
          }),
          "/project/src/App.jsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/src/App.jsx");
      });
    });

    describe("Unknown framework", () => {
      it("tries common patterns for root layout", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/src/App.tsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBe("/project/src/App.tsx");
      });

      it("returns null when no common patterns found", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/index.tsx": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.rootLayoutPath).toBeNull();
      });
    });

    describe("components/ directory discovery", () => {
      it("finds single components directory", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/src/components/Button.tsx": "export {}",
          "/project/src/components/Input.tsx": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.componentsDirs).toHaveLength(1);
        expect(result.componentsDirs).toContain("/project/src/components");
      });

      it("finds multiple components directories", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/src/components/ui/Button.tsx": "export {}",
          "/project/src/features/auth/components/LoginForm.tsx": "export {}",
          "/project/app/dashboard/components/Chart.tsx": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.componentsDirs).toHaveLength(3);
        expect(result.componentsDirs).toContain("/project/src/components");
        expect(result.componentsDirs).toContain(
          "/project/src/features/auth/components",
        );
        expect(result.componentsDirs).toContain(
          "/project/app/dashboard/components",
        );
      });

      it("excludes node_modules from components search", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/src/components/Button.tsx": "export {}",
          "/project/node_modules/some-lib/components/Thing.tsx": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.componentsDirs).toHaveLength(1);
        expect(result.componentsDirs).toContain("/project/src/components");
      });

      it("excludes .next from components search", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/src/components/Button.tsx": "export {}",
          "/project/.next/cache/components/cached.tsx": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.componentsDirs).toHaveLength(1);
        expect(result.componentsDirs).toContain("/project/src/components");
      });

      it("returns empty array when no components directories found", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/src/utils/helper.ts": "export {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.componentsDirs).toHaveLength(0);
      });
    });

    describe("directory priority", () => {
      it("prefers src/app over app", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/src/app/layout.tsx":
            "export default function RootLayout() {}",
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.appDirPath).toBe("/project/src/app");
        expect(result.rootLayoutPath).toBe("/project/src/app/layout.tsx");
      });

      it("prefers src/pages over pages", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/src/pages/_app.tsx": "export default function App() {}",
          "/project/pages/_app.tsx": "export default function App() {}",
        });

        const framework = detectFrameworkInfo("/project");
        const result = detectProjectStructure("/project", framework);

        expect(result.pagesDirPath).toBe("/project/src/pages");
        expect(result.rootLayoutPath).toBe("/project/src/pages/_app.tsx");
      });
    });
  });

  describe("detectTypeScriptConfig", () => {
    it("detects TypeScript with strict mode enabled", () => {
      vol.fromJSON({
        "/project/tsconfig.json": JSON.stringify({
          compilerOptions: {
            strict: true,
            target: "ES2020",
          },
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.configPath).toBe("/project/tsconfig.json");
      expect(result.strict).toBe(true);
    });

    it("detects TypeScript with strict mode disabled", () => {
      vol.fromJSON({
        "/project/tsconfig.json": JSON.stringify({
          compilerOptions: {
            strict: false,
            target: "ES2020",
          },
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.strict).toBe(false);
    });

    it("detects TypeScript without strict option", () => {
      vol.fromJSON({
        "/project/tsconfig.json": JSON.stringify({
          compilerOptions: {
            target: "ES2020",
          },
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.strict).toBeNull();
    });

    it("handles tsconfig.json with single-line comments", () => {
      vol.fromJSON({
        "/project/tsconfig.json": `{
  // This is a comment
  "compilerOptions": {
    "strict": true, // Enable strict mode
    "target": "ES2020"
  }
}`,
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.strict).toBe(true);
    });

    it("returns false when tsconfig.json doesn't exist", () => {
      vol.fromJSON({
        "/project/package.json": JSON.stringify({
          dependencies: { react: "^18.0.0" },
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(false);
      expect(result.configPath).toBeNull();
      expect(result.strict).toBeNull();
    });

    it("handles malformed tsconfig.json gracefully", () => {
      vol.fromJSON({
        "/project/tsconfig.json": "{ this is not valid json }",
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.configPath).toBe("/project/tsconfig.json");
      expect(result.strict).toBeNull();
    });

    it("handles tsconfig.json without compilerOptions", () => {
      vol.fromJSON({
        "/project/tsconfig.json": JSON.stringify({
          extends: "./base.json",
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.strict).toBeNull();
    });

    it("handles tsconfig.json with non-boolean strict value", () => {
      vol.fromJSON({
        "/project/tsconfig.json": JSON.stringify({
          compilerOptions: {
            strict: "true",
          },
        }),
      });

      const result = detectTypeScriptConfig("/project");

      expect(result.isTypeScript).toBe(true);
      expect(result.strict).toBeNull();
    });
  });
});
