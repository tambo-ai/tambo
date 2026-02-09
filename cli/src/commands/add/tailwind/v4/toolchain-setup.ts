import chalk from "chalk";
import fs from "fs";
import path from "path";
import { Project, ScriptKind, SyntaxKind } from "ts-morph";
import { execFileSync } from "../../../../utils/interactive.js";
import type { FrameworkConfig } from "../../../../utils/framework-detection.js";
import {
  detectPackageManager,
  formatPackageArgs,
  getDevFlag,
  getInstallCommand,
} from "../../../../utils/package-manager.js";

const VITE_CONFIG_FILES = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mjs",
] as const;

const POSTCSS_CONFIG_FILES = [
  "postcss.config.mjs",
  "postcss.config.js",
  "postcss.config.cjs",
] as const;

/**
 * Sets up the Tailwind CSS v4 build toolchain for the detected framework.
 *
 * - Vite: installs `@tailwindcss/vite` and adds it to the Vite config
 * - Next.js/Other: installs `@tailwindcss/postcss` and creates `postcss.config.mjs`
 *
 * @param projectRoot The root directory of the project
 * @param framework The detected framework config, or null if unknown
 */
export async function setupTailwindV4Toolchain(
  projectRoot: string,
  framework: FrameworkConfig | null,
): Promise<void> {
  if (framework?.name === "vite") {
    await setupVitePlugin(projectRoot);
    return;
  }

  await setupPostcssPlugin(projectRoot);
}

/**
 * Installs `@tailwindcss/vite` and adds it to the Vite config file.
 */
async function setupVitePlugin(projectRoot: string): Promise<void> {
  const configFile = findViteConfig(projectRoot);
  if (!configFile) {
    printManualViteInstructions();
    return;
  }

  const configPath = path.join(projectRoot, configFile);
  const content = fs.readFileSync(configPath, "utf-8");

  if (content.includes("@tailwindcss/vite")) {
    console.log(
      `${chalk.blue("ℹ")} @tailwindcss/vite already configured in ${configFile}`,
    );
    return;
  }

  const updated = addTailwindVitePlugin(content, configFile);
  if (!updated) {
    printManualViteInstructions();
    return;
  }

  // Install the dependency first so we don't leave a broken config if it fails
  const installed = installDevDependency(projectRoot, "@tailwindcss/vite");
  if (!installed) {
    return;
  }

  fs.writeFileSync(configPath, updated);
  console.log(
    `${chalk.green("✔")} Added @tailwindcss/vite plugin to ${configFile}`,
  );
}

/**
 * Creates a `postcss.config.mjs` and installs `@tailwindcss/postcss`.
 */
async function setupPostcssPlugin(projectRoot: string): Promise<void> {
  const existingConfig = POSTCSS_CONFIG_FILES.find((f) =>
    fs.existsSync(path.join(projectRoot, f)),
  );

  if (existingConfig) {
    const content = fs.readFileSync(
      path.join(projectRoot, existingConfig),
      "utf-8",
    );
    if (content.includes("@tailwindcss/postcss")) {
      console.log(
        `${chalk.blue("ℹ")} @tailwindcss/postcss already configured in ${existingConfig}`,
      );
      return;
    }
    console.log(
      `${chalk.yellow("⚠")} Found existing ${existingConfig} without @tailwindcss/postcss.`,
    );
    console.log(
      `${chalk.blue("ℹ")} Please add "@tailwindcss/postcss" to your PostCSS plugins manually.`,
    );
    installDevDependency(projectRoot, "@tailwindcss/postcss");
    return;
  }

  const configPath = path.join(projectRoot, "postcss.config.mjs");
  fs.writeFileSync(
    configPath,
    `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
  );
  console.log(`${chalk.green("✔")} Created postcss.config.mjs`);

  installDevDependency(projectRoot, "@tailwindcss/postcss");
}

/**
 * Finds the Vite config file in the project root.
 * @returns The config filename if found, null otherwise.
 */
function findViteConfig(projectRoot: string): string | null {
  return (
    VITE_CONFIG_FILES.find((f) => fs.existsSync(path.join(projectRoot, f))) ??
    null
  );
}

/**
 * Uses ts-morph to add the Tailwind Vite plugin to a Vite config file.
 * @returns The updated source text, or null if the config structure is unrecognizable.
 */
function addTailwindVitePlugin(
  source: string,
  filename: string,
): string | null {
  const project = new Project({
    skipFileDependencyResolution: true,
    compilerOptions: { allowJs: true },
  });

  const scriptKind = filename.endsWith(".ts") ? ScriptKind.TS : ScriptKind.JS;

  const sourceFile = project.createSourceFile("vite-config.ts", source, {
    scriptKind,
  });

  // Find the defineConfig call or the default export object
  const pluginsArray = findPluginsArray(sourceFile);
  if (!pluginsArray) {
    return null;
  }

  // Add import at the top of the file
  const importStatement = 'import tailwindcss from "@tailwindcss/vite";\n';

  // Check if the import already exists (belt-and-suspenders)
  const hasImport = sourceFile
    .getImportDeclarations()
    .some((decl) => decl.getModuleSpecifierValue() === "@tailwindcss/vite");

  let result = sourceFile.getFullText();

  // Insert the plugin call FIRST (positions are still valid from the original AST)
  const elements = pluginsArray.getElements();

  if (elements.length === 0) {
    // Empty array: [  ] -> [ tailwindcss() ]
    const pluginsText = pluginsArray.getText();
    const openBracket = pluginsText.indexOf("[");
    const arrayStart =
      pluginsArray.getStart() - sourceFile.getStart() + openBracket + 1;
    result =
      result.slice(0, arrayStart) +
      "tailwindcss(), " +
      result.slice(arrayStart);
  } else {
    // Prepend to existing elements: [react()] -> [tailwindcss(), react()]
    const firstElementStart = elements[0].getStart() - sourceFile.getStart();
    result =
      result.slice(0, firstElementStart) +
      "tailwindcss(), " +
      result.slice(firstElementStart);
  }

  // THEN add the import (at the top, so earlier positions are unaffected)
  if (!hasImport) {
    const imports = sourceFile.getImportDeclarations();
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const insertPos = lastImport.getEnd();
      result =
        result.slice(0, insertPos) +
        "\n" +
        importStatement +
        result.slice(insertPos);
    } else {
      result = importStatement + result;
    }
  }

  return result;
}

/**
 * Finds the `plugins` array in a Vite config source file.
 * Supports both `defineConfig({ plugins: [...] })` and `export default { plugins: [...] }`.
 */
function findPluginsArray(sourceFile: ReturnType<Project["createSourceFile"]>) {
  // Strategy 1: Look for defineConfig({ plugins: [...] })
  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  );

  for (const call of callExpressions) {
    const expr = call.getExpression();
    if (expr.getText() !== "defineConfig") continue;

    const args = call.getArguments();
    if (args.length === 0) continue;

    const firstArg = args[0];
    if (firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;

    const pluginsProp = firstArg
      .asKind(SyntaxKind.ObjectLiteralExpression)
      ?.getProperty("plugins");

    if (!pluginsProp) continue;

    const initializer = pluginsProp
      .asKind(SyntaxKind.PropertyAssignment)
      ?.getInitializer();

    if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
      return initializer.asKind(SyntaxKind.ArrayLiteralExpression) ?? null;
    }
  }

  // Strategy 2: Look for export default { plugins: [...] }
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) {
    const declarations = defaultExport.getDeclarations();
    for (const decl of declarations) {
      const objectLiteral = decl.getDescendantsOfKind(
        SyntaxKind.ObjectLiteralExpression,
      )[0];
      if (!objectLiteral) continue;

      const pluginsProp = objectLiteral.getProperty("plugins");
      if (!pluginsProp) continue;

      const initializer = pluginsProp
        .asKind(SyntaxKind.PropertyAssignment)
        ?.getInitializer();

      if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
        return initializer.asKind(SyntaxKind.ArrayLiteralExpression) ?? null;
      }
    }
  }

  return null;
}

/**
 * Installs a package as a dev dependency using the detected package manager.
 * @returns Whether the installation succeeded.
 */
function installDevDependency(
  projectRoot: string,
  packageName: string,
): boolean {
  const pm = detectPackageManager(projectRoot);
  const installCmd = getInstallCommand(pm);
  const devFlag = getDevFlag(pm);
  const args = [
    ...installCmd,
    devFlag,
    ...formatPackageArgs(pm, [packageName]),
  ];

  console.log(`${chalk.blue("ℹ")} Installing ${packageName} using ${pm}...`);

  try {
    execFileSync(pm, args, {
      stdio: "inherit",
      encoding: "utf-8",
      allowNonInteractive: true,
    });
    console.log(`${chalk.green("✔")} Installed ${packageName}`);
    return true;
  } catch (error) {
    console.error(
      `${chalk.red("✖")} Failed to install ${packageName}: ${error}`,
    );
    console.log(
      `${chalk.blue("ℹ")} Please install it manually: ${[pm, ...args].join(" ")}`,
    );
    return false;
  }
}

/**
 * Prints manual instructions for adding the Tailwind Vite plugin.
 */
function printManualViteInstructions(): void {
  console.log(
    `${chalk.yellow("⚠")} Could not automatically update your Vite config.`,
  );
  console.log(
    `${chalk.blue("ℹ")} Please add the Tailwind CSS Vite plugin manually:`,
  );
  console.log(
    chalk.gray(`
  // vite.config.ts
  import tailwindcss from "@tailwindcss/vite";

  export default defineConfig({
    plugins: [tailwindcss(), /* ...other plugins */],
  });
`),
  );
  console.log(
    `${chalk.blue("ℹ")} Then install the plugin: npm install -D @tailwindcss/vite`,
  );
}

/**
 * Gets the default CSS file path based on the detected framework.
 * @returns A relative path suitable for creating a new globals CSS file.
 */
export function getDefaultCssPath(
  projectRoot: string,
  framework: FrameworkConfig | null,
): string {
  const hasSrcDir = fs.existsSync(path.join(projectRoot, "src"));

  if (framework?.name === "vite") {
    return hasSrcDir ? "src/index.css" : "index.css";
  }

  // Next.js or default
  const appPath = hasSrcDir ? "src/app" : "app";
  return path.join(appPath, "globals.css");
}
