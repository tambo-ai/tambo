import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

// Mock fs before importing module under test
jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

// Mock the interactive module's execFileSync directly
const mockExecFileSync = jest.fn<
  (file: string, args?: readonly string[], options?: unknown) => string
>(() => "");

jest.unstable_mockModule("../../../../utils/interactive.js", () => ({
  execFileSync: mockExecFileSync,
  isInteractive: () => false,
}));

// Import after mocking
const { setupTailwindV4Toolchain, getDefaultCssPath } =
  await import("./toolchain-setup.js");

const NEXT_FRAMEWORK = {
  name: "next" as const,
  displayName: "Next.js",
  envPrefix: "NEXT_PUBLIC_",
};

const VITE_FRAMEWORK = {
  name: "vite" as const,
  displayName: "Vite",
  envPrefix: "VITE_",
};

/**
 * Checks if any call to mockExecFileSync included the given package name in its args.
 */
function wasPackageInstalled(packageName: string): boolean {
  return mockExecFileSync.mock.calls.some((call) => {
    const args = call[1];
    return args?.includes(packageName);
  });
}

describe("toolchain-setup", () => {
  let originalCwd: () => string;

  beforeEach(() => {
    vol.reset();
    mockExecFileSync.mockClear();
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;
  });

  describe("setupTailwindV4Toolchain", () => {
    it("creates postcss.config.mjs for Next.js projects", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
      });

      await setupTailwindV4Toolchain("/mock-project", NEXT_FRAMEWORK);

      // Next.js needs @tailwindcss/postcss for Tailwind v4
      expect(vol.existsSync("/mock-project/postcss.config.mjs")).toBe(true);
      const content = vol.readFileSync(
        "/mock-project/postcss.config.mjs",
        "utf-8",
      ) as string;
      expect(content).toContain("@tailwindcss/postcss");
      expect(wasPackageInstalled("@tailwindcss/postcss")).toBe(true);
    });

    it("skips postcss setup for Next.js if already configured", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { next: "^14.0.0" },
        }),
        "/mock-project/postcss.config.mjs": `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
      });

      await setupTailwindV4Toolchain("/mock-project", NEXT_FRAMEWORK);

      // Already configured — should not install anything
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it("installs @tailwindcss/vite and updates config for Vite projects", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
        "/mock-project/vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
      });

      await setupTailwindV4Toolchain("/mock-project", VITE_FRAMEWORK);

      // Should have updated vite.config.ts with tailwindcss import and plugin
      const updatedConfig = vol.readFileSync(
        "/mock-project/vite.config.ts",
        "utf-8",
      ) as string;
      expect(updatedConfig).toContain("@tailwindcss/vite");
      expect(updatedConfig).toContain("tailwindcss()");

      // Should have called install for @tailwindcss/vite
      expect(wasPackageInstalled("@tailwindcss/vite")).toBe(true);
    });

    it("skips Vite config update if @tailwindcss/vite is already configured", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
        "/mock-project/vite.config.ts": `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
});
`,
      });

      await setupTailwindV4Toolchain("/mock-project", VITE_FRAMEWORK);

      // Should NOT have installed anything (already configured)
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it("creates postcss.config.mjs for unknown frameworks", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
      });

      await setupTailwindV4Toolchain("/mock-project", null);

      // Should have created postcss.config.mjs
      expect(vol.existsSync("/mock-project/postcss.config.mjs")).toBe(true);
      const content = vol.readFileSync(
        "/mock-project/postcss.config.mjs",
        "utf-8",
      ) as string;
      expect(content).toContain("@tailwindcss/postcss");

      // Should have called install for @tailwindcss/postcss
      expect(wasPackageInstalled("@tailwindcss/postcss")).toBe(true);
    });

    it("skips postcss config creation if one already exists with the plugin", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/postcss.config.mjs": `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
      });

      await setupTailwindV4Toolchain("/mock-project", null);

      // Should NOT install anything (already configured)
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });

    it("installs @tailwindcss/postcss when existing postcss config lacks it", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          dependencies: { react: "^18.0.0" },
        }),
        "/mock-project/postcss.config.js": `module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
`,
      });

      await setupTailwindV4Toolchain("/mock-project", null);

      // Should NOT create a new config file
      expect(vol.existsSync("/mock-project/postcss.config.mjs")).toBe(false);

      // Should still install the package
      expect(wasPackageInstalled("@tailwindcss/postcss")).toBe(true);
    });

    it("prints manual instructions when Vite config has no plugins array", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
        "/mock-project/vite.config.ts": `export default {};`,
      });

      // Should not throw, just print instructions
      await setupTailwindV4Toolchain("/mock-project", VITE_FRAMEWORK);

      // Config should not have been modified (no plugins array found)
      const config = vol.readFileSync(
        "/mock-project/vite.config.ts",
        "utf-8",
      ) as string;
      expect(config).toBe("export default {};");
    });

    it("handles Vite config with .js extension", async () => {
      vol.fromJSON({
        "/mock-project/package.json": JSON.stringify({
          name: "test-project",
          devDependencies: { vite: "^5.0.0" },
        }),
        "/mock-project/vite.config.js": `import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
});
`,
      });

      await setupTailwindV4Toolchain("/mock-project", VITE_FRAMEWORK);

      const updatedConfig = vol.readFileSync(
        "/mock-project/vite.config.js",
        "utf-8",
      ) as string;
      expect(updatedConfig).toContain("@tailwindcss/vite");
      expect(updatedConfig).toContain("tailwindcss()");
    });
  });

  describe("getDefaultCssPath", () => {
    it("returns src/index.css for Vite projects with src dir", () => {
      vol.fromJSON({
        "/mock-project/src/main.tsx": "",
      });

      const result = getDefaultCssPath("/mock-project", {
        name: "vite",
        displayName: "Vite",
        envPrefix: "VITE_",
      });
      expect(result).toBe("src/index.css");
    });

    it("returns index.css for Vite projects without src dir", () => {
      vol.fromJSON({
        "/mock-project/package.json": "{}",
      });

      const result = getDefaultCssPath("/mock-project", {
        name: "vite",
        displayName: "Vite",
        envPrefix: "VITE_",
      });
      expect(result).toBe("index.css");
    });

    it("returns src/app/globals.css for Next.js projects with src dir", () => {
      vol.fromJSON({
        "/mock-project/src/app/page.tsx": "",
      });

      const result = getDefaultCssPath("/mock-project", {
        name: "next",
        displayName: "Next.js",
        envPrefix: "NEXT_PUBLIC_",
      });
      expect(result).toContain("src/app/globals.css");
    });

    it("returns app/globals.css for Next.js projects without src dir", () => {
      vol.fromJSON({
        "/mock-project/package.json": "{}",
      });

      const result = getDefaultCssPath("/mock-project", {
        name: "next",
        displayName: "Next.js",
        envPrefix: "NEXT_PUBLIC_",
      });
      expect(result).toContain("app/globals.css");
    });

    it("returns app/globals.css when no framework is detected", () => {
      vol.fromJSON({
        "/mock-project/package.json": "{}",
      });

      const result = getDefaultCssPath("/mock-project", null);
      expect(result).toContain("app/globals.css");
    });
  });
});
