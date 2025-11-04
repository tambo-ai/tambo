import { vol, fs as memfsFs } from "memfs";
import * as realFs from "fs";

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
