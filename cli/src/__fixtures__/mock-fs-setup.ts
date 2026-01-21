import * as realFs from "fs";
import { fs as memfsFs, vol } from "memfs";

let fsPatched = false;

/**
 * Sets up a mock filesystem using memfs with the provided structure
 * Patches the real fs module to use memfs
 * @param structure A nested object representing the filesystem structure
 */
export function setupMockFs(structure: Record<string, string>): void {
  vol.reset();
  vol.fromJSON(structure);

  // Patch fs module methods to use memfs
  if (!fsPatched) {
    // Store original methods
    const originalMethods = {
      existsSync: realFs.existsSync,
      readFileSync: realFs.readFileSync,
      writeFileSync: realFs.writeFileSync,
      readdirSync: realFs.readdirSync,
      statSync: realFs.statSync,
      mkdirSync: realFs.mkdirSync,
    };

    // Patch with memfs
    Object.assign(realFs, {
      existsSync: memfsFs.existsSync.bind(memfsFs),
      readFileSync: memfsFs.readFileSync.bind(memfsFs),
      writeFileSync: memfsFs.writeFileSync.bind(memfsFs),
      readdirSync: memfsFs.readdirSync.bind(memfsFs),
      statSync: memfsFs.statSync.bind(memfsFs),
      mkdirSync: memfsFs.mkdirSync.bind(memfsFs),
    });

    // Store originals for restoration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (realFs as any).__originalMethods = originalMethods;
    fsPatched = true;
  }
}

/**
 * Cleans up the mock filesystem and restores original fs methods
 */
export function cleanupMockFs(): void {
  vol.reset();

  // Restore original fs methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (fsPatched && (realFs as any).__originalMethods) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.assign(realFs, (realFs as any).__originalMethods);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (realFs as any).__originalMethods;
    fsPatched = false;
  }
}

/**
 * Creates a mock package.json file content
 */
export function createMockPackageJson(): string {
  return JSON.stringify(
    {
      name: "test-project",
      version: "1.0.0",
      dependencies: {},
    },
    null,
    2,
  );
}

/**
 * Creates a mock component config.json content
 */
export function createMockComponentConfig(
  componentName: string,
  description = "Test component",
  files: string[] = [],
): string {
  return JSON.stringify(
    {
      name: componentName,
      description,
      componentName,
      files: files.map((name) => ({ name })),
    },
    null,
    2,
  );
}

/**
 * Creates a basic filesystem structure for testing list command
 */
export function createBasicProjectStructure(options: {
  hasPackageJson?: boolean;
  newComponents?: string[];
  legacyComponents?: string[];
  registryComponents?: {
    name: string;
    description?: string;
    files?: string[];
  }[];
  installPath?: string;
}): Record<string, string> {
  const {
    hasPackageJson = true,
    newComponents = [],
    legacyComponents = [],
    registryComponents = [],
    installPath = "src/components",
  } = options;

  const structure: Record<string, string> = {};

  // Add package.json if requested
  if (hasPackageJson) {
    structure["/mock-project/package.json"] = createMockPackageJson();
  }

  // Add components in new location (tambo/)
  newComponents.forEach((component) => {
    structure[`/mock-project/${installPath}/tambo/${component}.tsx`] =
      `export const ${component} = () => null;`;
  });

  // Add components in legacy location (ui/)
  legacyComponents.forEach((component) => {
    structure[`/mock-project/${installPath}/ui/${component}.tsx`] =
      `export const ${component} = () => null;`;
  });

  // Add registry components
  registryComponents.forEach(({ name, description, files }) => {
    structure[`/mock-project/src/registry/${name}/config.json`] =
      createMockComponentConfig(name, description, files);
    structure[`/mock-project/src/registry/${name}/${name}.tsx`] =
      `export const ${name} = () => null;`;

    // Add additional files if specified
    if (files) {
      files.forEach((fileName) => {
        structure[`/mock-project/src/registry/${name}/${fileName}`] =
          `export const ${fileName.replace(".tsx", "")} = () => null;`;
      });
    }
  });

  return structure;
}

/**
 * Mocks process.cwd() to return a specific directory
 */
export function mockProcessCwd(cwd: string): () => void {
  const originalCwd = process.cwd;
  process.cwd = () => cwd;

  // Return cleanup function
  return () => {
    process.cwd = originalCwd;
  };
}

/**
 * Captures console.log output
 */
export function captureConsoleOutput(): {
  logs: string[];
  restore: () => void;
} {
  const logs: string[] = [];
  const originalLog = console.log;

  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };

  return {
    logs,
    restore: () => {
      console.log = originalLog;
    },
  };
}

/**
 * Creates a basic project structure with just package.json
 * Framework-agnostic - no framework dependencies included
 */
export function createBasicProject(): Record<string, string | null> {
  return {
    "/mock-project/package.json": JSON.stringify({
      name: "test-project",
      dependencies: {},
    }),
  };
}

/**
 * Creates a basic Next.js project structure
 * Use this when testing Next.js-specific behavior (e.g., env var prefix detection)
 */
export function createNextProject(): Record<string, string | null> {
  return {
    "/mock-project/package.json": JSON.stringify({
      name: "test-project",
      dependencies: {
        next: "^16.0.0",
      },
    }),
  };
}

/**
 * Creates a project with Tambo SDK dependency and src directory
 * Framework-agnostic - no framework dependencies included
 */
export function createProjectWithTamboSDK(): Record<string, string | null> {
  return {
    "/mock-project/package.json": JSON.stringify({
      name: "test-project",
      dependencies: {
        "@tambo-ai/react": "^1.0.0",
      },
    }),
    "/mock-project/src": null,
  };
}

/**
 * Creates a Next.js project with Tambo SDK dependency and src directory
 * Use this when testing Next.js-specific behavior (e.g., env var prefix detection)
 */
export function createNextProjectWithTamboSDK(): Record<string, string | null> {
  return {
    "/mock-project/package.json": JSON.stringify({
      name: "test-project",
      dependencies: {
        next: "^14.0.0",
        "@tambo-ai/react": "^1.0.0",
      },
    }),
    "/mock-project/src": null,
  };
}

/**
 * Creates a Next.js project with existing API key in .env.local
 * Uses Next.js because it references NEXT_PUBLIC_TAMBO_API_KEY
 */
export function createProjectWithEnv(
  key: string,
): Record<string, string | null> {
  return {
    ...createNextProject(),
    "/mock-project/.env.local": `NEXT_PUBLIC_TAMBO_API_KEY=${key}\n`,
  };
}

/**
 * Creates a Next.js project with both .env and .env.local files
 * Uses Next.js because it references NEXT_PUBLIC_TAMBO_API_KEY
 */
export function createProjectWithBothEnvFiles(
  localKey: string,
  envKey: string,
): Record<string, string | null> {
  return {
    ...createNextProject(),
    "/mock-project/.env": `NEXT_PUBLIC_TAMBO_API_KEY=${envKey}\n`,
    "/mock-project/.env.local": `NEXT_PUBLIC_TAMBO_API_KEY=${localKey}\n`,
  };
}

/**
 * Creates a Next.js project with existing tambo.ts file
 * Uses Next.js because this is typically used for init tests that expect NEXT_PUBLIC_TAMBO_API_KEY
 */
export function createProjectWithTamboTs(
  content?: string,
): Record<string, string | null> {
  return {
    ...createNextProject(),
    "/mock-project/src": null,
    "/mock-project/src/lib/tambo.ts":
      content ?? "export const components: TamboComponent[] = [];",
  };
}

/**
 * Creates the registry files structure for tests
 * The registry is always present in the CLI, so these files should always be available
 * @param components Optional array of component names to include (defaults to common ones)
 */
export function createRegistryFiles(
  components: string[] = [
    "message-thread-full",
    "message-thread-panel",
    "message-thread-collapsible",
    "control-bar",
  ],
): Record<string, string | null> {
  const registry: Record<string, string | null> = {
    "/mock-project/cli/dist/commands/add/utils.js": "// Utils placeholder",
    // Add Tailwind config files to the registry mock (now in styles/ directory)
    "/mock-project/cli/dist/registry/styles/tailwind.config.ts": `import type { Config } from "tailwindcss";\nconst config: Config = { darkMode: "class", content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"], };\nexport default config;`,
    "/mock-project/cli/dist/registry/styles/globals-v3.css": `@import "tailwindcss";\n\nbody {\n  background: var(--background);\n  color: var(--foreground);\n  font-family: Arial, Helvetica, sans-serif;\n}\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n    --popover: 0 0% 100%;\n    --popover-foreground: 222.2 84% 4.9%;\n    --primary: 222.2 47.4% 11.2%;\n    --primary-foreground: 210 40% 98%;\n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: 222.2 84% 4.9%;\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 222.2 47.4% 11.2%;\n    --foreground: 210 40% 98%;\n    --card: 222.2 47.4% 11.2%;\n    --card-foreground: 210 40% 98%;\n    --popover: 222.2 47.4% 11.2%;\n    --popover-foreground: 210 40% 98%;\n    --primary: 210 40% 98%;\n    --primary-foreground: 222.2 47.4% 11.2%;\n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 212.7 26.8% 83.9%;\n  }\n}\n`,
    "/mock-project/cli/dist/registry/styles/globals-v4.css": `@import "tailwindcss";\n\n@theme inline {\n  --background: 0 0% 100%;\n  --foreground: 222.2 84% 4.9%;\n  --card: 0 0% 100%;\n  --card-foreground: 222.2 84% 4.9%;\n  --popover: 0 0% 100%;\n  --popover-foreground: 222.2 84% 4.9%;\n  --primary: 222.2 47.4% 11.2%;\n  --primary-foreground: 210 40% 98%;\n  --secondary: 210 40% 96.1%;\n  --secondary-foreground: 222.2 47.4% 11.2%;\n  --muted: 210 40% 96.1%;\n  --muted-foreground: 215.4 16.3% 46.9%;\n  --accent: 210 40% 96.1%;\n  --accent-foreground: 222.2 47.4% 11.2%;\n  --destructive: 0 84.2% 60.2%;\n  --destructive-foreground: 210 40% 98%;\n  --border: 214.3 31.8% 91.4%;\n  --input: 214.3 31.8% 91.4%;\n  --ring: 222.2 84% 4.9%;\n  --radius: 0.5rem;\n\n  @media (prefers-color-scheme: dark) {\n    --background: 222.2 47.4% 11.2%;\n    --foreground: 210 40% 98%;\n    --card: 222.2 47.4% 11.2%;\n    --card-foreground: 210 40% 98%;\n    --popover: 222.2 47.4% 11.2%;\n    --popover-foreground: 210 40% 98%;\n    --primary: 210 40% 98%;\n    --primary-foreground: 222.2 47.4% 11.2%;\n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 212.7 26.8% 83.9%;\n  }\n}\n\n@custom-variant light {\n  @media (prefers-color-scheme: light) {\n    &:root {\n      @apply light;\n    }\n  }\n}\n\n@custom-variant dark {\n  @media (prefers-color-scheme: dark) {\n    &:root {\n      @apply dark;\n    }\n  }\n}\n\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
  };

  // Component configs - simplified versions for testing
  const componentConfigs: Record<
    string,
    {
      description: string;
      componentName: string;
      dependencies: string[];
      requires: string[];
      files: string[];
    }
  > = {
    "message-thread-full": {
      description:
        "Full-screen chat interface with history and typing indicators",
      componentName: "MessageThreadFull",
      dependencies: ["@tambo-ai/react", "class-variance-authority"],
      requires: [
        "thread-content",
        "message-input",
        "message-suggestions",
        "thread-history",
        "message",
        "scrollable-message-container",
      ],
      files: ["message-thread-full.tsx"],
    },
    "message-thread-panel": {
      description: "Split-view chat with integrated workspace",
      componentName: "MessageThreadPanel",
      dependencies: ["@tambo-ai/react"],
      requires: [],
      files: ["message-thread-panel.tsx"],
    },
    "message-thread-collapsible": {
      description: "Collapsible chat for sidebars",
      componentName: "MessageThreadCollapsible",
      dependencies: ["@tambo-ai/react"],
      requires: [],
      files: ["message-thread-collapsible.tsx"],
    },
    "control-bar": {
      description: "Spotlight-style command palette",
      componentName: "ControlBar",
      dependencies: ["@tambo-ai/react", "radix-ui", "class-variance-authority"],
      requires: [
        "thread-content",
        "message-input",
        "message",
        "scrollable-message-container",
      ],
      files: ["control-bar.tsx"],
    },
  };

  // Set of all components we need to create (including dependencies)
  const allComponentsToCreate = new Set(components);

  // First pass: collect all required dependencies
  components.forEach((componentName) => {
    const config = componentConfigs[componentName];
    if (config) {
      config.requires.forEach((dep) => allComponentsToCreate.add(dep));
    }
  });

  // Helper to create a component config and file
  const createComponent = (componentName: string) => {
    const config = componentConfigs[componentName];
    if (!config) {
      // Fallback for unknown components (e.g., dependencies)
      const componentNamePascal =
        componentName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("") || componentName;
      registry[
        `/mock-project/cli/dist/registry/components/${componentName}/config.json`
      ] = JSON.stringify({
        name: componentName,
        description: `Test component ${componentName}`,
        componentName: componentNamePascal,
        dependencies: ["@tambo-ai/react"],
        devDependencies: [],
        requires: [],
        files: [
          {
            name: `${componentName}.tsx`,
            content: `export const ${componentNamePascal} = () => <div>${componentNamePascal}</div>;`,
          },
        ],
      });
      registry[
        `/mock-project/cli/dist/registry/components/${componentName}/${componentName}.tsx`
      ] =
        `export const ${componentNamePascal} = () => <div>${componentNamePascal}</div>;`;
    } else {
      registry[
        `/mock-project/cli/dist/registry/components/${componentName}/config.json`
      ] = JSON.stringify({
        name: componentName,
        description: config.description,
        componentName: config.componentName,
        dependencies: config.dependencies,
        devDependencies: [],
        requires: config.requires,
        files: config.files.map((fileName) => ({
          name: fileName,
          content: `export const ${config.componentName} = () => <div>${config.componentName}</div>;`,
        })),
      });
      // Add component file
      config.files.forEach((fileName) => {
        registry[
          `/mock-project/cli/dist/registry/components/${componentName}/${fileName}`
        ] =
          `export const ${config.componentName} = () => <div>${config.componentName}</div>;`;
      });
    }
  };

  // Create all components (including dependencies)
  allComponentsToCreate.forEach((componentName) => {
    createComponent(componentName);
  });

  return registry;
}

/**
 * Creates a Next.js project with Tambo SDK, src directory, and registry files
 * This is the most common setup for full-send tests that expect NEXT_PUBLIC_TAMBO_API_KEY
 */
export function createProjectWithTamboSDKAndRegistry(
  components: string[] = [
    "message-thread-full",
    "message-thread-panel",
    "message-thread-collapsible",
    "control-bar",
  ],
): Record<string, string | null> {
  return {
    ...createNextProjectWithTamboSDK(),
    ...createRegistryFiles(components),
  };
}
