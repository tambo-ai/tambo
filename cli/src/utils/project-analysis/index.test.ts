import fs from "fs";
import os from "os";
import path from "path";
import { analyzeProject } from "./index";

describe("analyzeProject", () => {
  let tempDir: string;

  beforeAll(() => {
    // Create a temp directory simulating a Next.js App Router project
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "analyze-project-test-"));

    // Create package.json with Next.js dependency
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify(
        {
          name: "test-project",
          dependencies: {
            next: "^14.0.0",
            react: "^18.0.0",
          },
        },
        null,
        2,
      ),
    );

    // Create package-lock.json for npm detection
    fs.writeFileSync(path.join(tempDir, "package-lock.json"), "{}");

    // Create tsconfig.json with strict mode
    fs.writeFileSync(
      path.join(tempDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            target: "ES2020",
          },
        },
        null,
        2,
      ),
    );

    // Create src directory structure
    const srcDir = path.join(tempDir, "src");
    fs.mkdirSync(srcDir);

    // Create app directory with layout.tsx
    const appDir = path.join(srcDir, "app");
    fs.mkdirSync(appDir);

    const layoutFile = path.join(appDir, "layout.tsx");
    fs.writeFileSync(
      layoutFile,
      `import { ThemeProvider } from '@/contexts/theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`,
    );

    // Create components directory with a test component
    const componentsDir = path.join(srcDir, "components");
    fs.mkdirSync(componentsDir);

    const componentFile = path.join(componentsDir, "Button.tsx");
    fs.writeFileSync(
      componentFile,
      `import { useState } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

/**
 * A reusable button component
 */
export function Button({ label, onClick }: ButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <button onClick={() => {
      onClick();
      setIsClicked(true);
    }}>
      {label}
    </button>
  );
}
`,
    );

    // Create actions directory with a server action
    const actionsDir = path.join(srcDir, "actions");
    fs.mkdirSync(actionsDir);

    const actionsFile = path.join(actionsDir, "user-actions.ts");
    fs.writeFileSync(
      actionsFile,
      `"use server";

/**
 * Creates a new user in the database
 */
export async function createUser(name: string, email: string) {
  // Server-side logic here
  return { id: 1, name, email };
}
`,
    );
  });

  afterAll(() => {
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("produces a complete ProjectAnalysis from a Next.js App Router project", () => {
    const analysis = analyzeProject(tempDir);

    // Framework detection
    expect(analysis.framework.name).toBe("next");
    expect(analysis.framework.variant).toBe("next-app-router");
    expect(analysis.framework.displayName).toBe("Next.js App Router");

    // Project structure
    expect(analysis.structure.hasSrcDir).toBe(true);
    expect(analysis.structure.srcPath).toBe(path.join(tempDir, "src"));
    expect(analysis.structure.appDirPath).toBe(
      path.join(tempDir, "src", "app"),
    );
    expect(analysis.structure.pagesDirPath).toBeNull();
    expect(analysis.structure.rootLayoutPath).toBe(
      path.join(tempDir, "src", "app", "layout.tsx"),
    );
    expect(analysis.structure.componentsDirs).toContain(
      path.join(tempDir, "src", "components"),
    );

    // TypeScript configuration
    expect(analysis.typescript.isTypeScript).toBe(true);
    expect(analysis.typescript.configPath).toBe(
      path.join(tempDir, "tsconfig.json"),
    );
    expect(analysis.typescript.strict).toBe(true);

    // Package manager
    expect(analysis.packageManager).toBe("npm");

    // Providers
    expect(analysis.providers).toHaveLength(1);
    expect(analysis.providers[0]).toMatchObject({
      name: "ThemeProvider",
      importSource: "@/contexts/theme",
      nestingLevel: 0,
    });

    // Components
    expect(analysis.components.length).toBeGreaterThanOrEqual(1);
    const buttonComponent = analysis.components.find(
      (c) => c.name === "Button",
    );
    expect(buttonComponent).toBeDefined();
    expect(buttonComponent).toMatchObject({
      name: "Button",
      isExported: true,
      hasProps: true,
      propsInterface: "ButtonProps",
    });
    expect(buttonComponent?.hooks).toContain("useState");

    // Tool candidates
    expect(analysis.toolCandidates.length).toBeGreaterThanOrEqual(1);
    const serverAction = analysis.toolCandidates.find(
      (c) => c.name === "createUser",
    );
    expect(serverAction).toBeDefined();
    expect(serverAction).toMatchObject({
      name: "createUser",
      type: "server-action",
      description: "Creates a new user in the database",
    });
  });

  it("handles projects with no providers or components", () => {
    // Create a minimal project
    const minimalDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "minimal-project-test-"),
    );

    try {
      // Just package.json, no framework dependencies
      fs.writeFileSync(
        path.join(minimalDir, "package.json"),
        JSON.stringify({ name: "minimal" }, null, 2),
      );

      const analysis = analyzeProject(minimalDir);

      // Should still complete without errors
      expect(analysis.framework.name).toBe("unknown");
      expect(analysis.structure.rootLayoutPath).toBeNull();
      expect(analysis.providers).toHaveLength(0);
      expect(analysis.components).toHaveLength(0);
      expect(analysis.toolCandidates).toHaveLength(0);
    } finally {
      fs.rmSync(minimalDir, { recursive: true, force: true });
    }
  });
});
