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
const { detectFrameworkInfo } = await import("./framework-detection.js");

describe("framework-detection", () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vol.reset();
  });

  describe("detectFrameworkInfo", () => {
    describe("Next.js detection", () => {
      it("detects Next.js App Router via app/layout.tsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0", react: "^18.0.0" },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
        expect(result.variant).toBe("next-app-router");
        expect(result.displayName).toBe("Next.js App Router");
        expect(result.envPrefix).toBe("NEXT_PUBLIC_");
      });

      it("detects Next.js App Router via src/app/layout.tsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/src/app/layout.tsx":
            "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
        expect(result.variant).toBe("next-app-router");
      });

      it("detects Next.js App Router via app/layout.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/app/layout.jsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.variant).toBe("next-app-router");
      });

      it("detects Next.js Pages Router via pages/_app.tsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/pages/_app.tsx": "export default function App() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
        expect(result.variant).toBe("next-pages-router");
        expect(result.displayName).toBe("Next.js Pages Router");
        expect(result.envPrefix).toBe("NEXT_PUBLIC_");
      });

      it("detects Next.js Pages Router via src/pages/_app.tsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/src/pages/_app.tsx": "export default function App() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.variant).toBe("next-pages-router");
      });

      it("detects Next.js Pages Router via pages/_app.jsx", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^13.0.0" },
          }),
          "/project/pages/_app.jsx": "export default function App() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.variant).toBe("next-pages-router");
      });

      it("prefers App Router when both app and pages directories exist", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
          "/project/pages/_app.tsx": "export default function App() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.variant).toBe("next-app-router");
      });

      it("defaults to App Router when no layout files exist", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.variant).toBe("next-app-router");
      });

      it("detects Next.js via next.config.js", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/next.config.js": "module.exports = {}",
          "/project/pages/_app.tsx": "export default function App() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });

      it("detects Next.js via next.config.ts", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/next.config.ts": "export default {}",
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });

      it("detects Next.js via next.config.mjs", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/next.config.mjs": "export default {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });

      it("detects Next.js from devDependencies", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
            devDependencies: { next: "^14.0.0" },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });
    });

    describe("Vite detection", () => {
      it("detects Vite via vite dependency", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
            devDependencies: { vite: "^5.0.0" },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("vite");
        expect(result.displayName).toBe("Vite");
        expect(result.envPrefix).toBe("VITE_");
        expect(result.variant).toBeUndefined();
      });

      it("detects Vite via vite.config.ts", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/vite.config.ts": "export default {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("vite");
      });

      it("detects Vite via vite.config.js", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/vite.config.js": "export default {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("vite");
      });

      it("detects Vite via vite.config.mjs", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
          "/project/vite.config.mjs": "export default {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("vite");
      });
    });

    describe("Remix detection", () => {
      it("detects Remix via @remix-run/react dependency", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: {
              react: "^18.0.0",
              "@remix-run/react": "^2.0.0",
            },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("remix");
        expect(result.displayName).toBe("Remix");
        expect(result.envPrefix).toBeNull();
        expect(result.variant).toBeUndefined();
      });

      it("detects Remix from devDependencies", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
            devDependencies: { "@remix-run/react": "^2.0.0" },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("remix");
      });
    });

    describe("CRA detection", () => {
      it("detects CRA via react-scripts dependency", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: {
              react: "^18.0.0",
              "react-scripts": "^5.0.0",
            },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("cra");
        expect(result.displayName).toBe("Create React App");
        expect(result.envPrefix).toBe("REACT_APP_");
        expect(result.variant).toBeUndefined();
      });

      it("detects CRA from devDependencies", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
            devDependencies: { "react-scripts": "^5.0.0" },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("cra");
      });
    });

    describe("Framework priority", () => {
      it("prioritizes Next.js over Vite when both present", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { next: "^14.0.0" },
            devDependencies: { vite: "^5.0.0" },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });

      it("prioritizes Next.js over CRA when both present", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: {
              next: "^14.0.0",
              "react-scripts": "^5.0.0",
            },
          }),
          "/project/app/layout.tsx": "export default function RootLayout() {}",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("next");
      });

      it("prioritizes Vite over Remix when both present", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: {
              "@remix-run/react": "^2.0.0",
            },
            devDependencies: {
              vite: "^5.0.0",
            },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("vite");
      });

      it("prioritizes Remix over CRA when both present", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: {
              "@remix-run/react": "^2.0.0",
              "react-scripts": "^5.0.0",
            },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("remix");
      });
    });

    describe("Unknown framework", () => {
      it("returns unknown when no framework detected", () => {
        vol.fromJSON({
          "/project/package.json": JSON.stringify({
            dependencies: { react: "^18.0.0" },
          }),
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("unknown");
        expect(result.displayName).toBe("Unknown");
        expect(result.envPrefix).toBeNull();
        expect(result.variant).toBeUndefined();
      });

      it("returns unknown when package.json is missing", () => {
        vol.fromJSON({
          "/project/src/index.ts": "console.log('hello')",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("unknown");
      });

      it("returns unknown when package.json is invalid", () => {
        vol.fromJSON({
          "/project/package.json": "{ invalid json }",
        });

        const result = detectFrameworkInfo("/project");

        expect(result.name).toBe("unknown");
      });
    });
  });
});
