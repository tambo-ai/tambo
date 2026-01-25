/**
 * @param projectRoot The root directory of the project
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";
import {
  Project,
  ScriptKind,
  SyntaxKind,
  type ObjectLiteralExpression,
} from "ts-morph";
import { execFileSync } from "../../utils/interactive.js";
import {
  detectPackageManager,
  formatPackageArgs,
  getDevFlag,
  getInstallCommand,
} from "../../utils/package-manager.js";

export async function setupViteTailwindPlugin(projectRoot: string) {
  // Configuring how to install
  const pm = detectPackageManager(projectRoot);
  const installCmd = getInstallCommand(pm);
  const devFlag = getDevFlag(pm);

  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageRaw = fs.readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageRaw);
  const installedDeps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  // checking and installing "@tailwind/vite"
  if (!installedDeps["@tailwindcss/vite"]) {
    console.log(
      ` Installing @tailwindcss/vite...  In the mean time don't forget to read our Docs https://docs.tambo.co`,
    );

    try {
      const args = [
        ...installCmd,
        devFlag,
        ...formatPackageArgs(pm, ["@tailwindcss/vite"]),
      ];
      execFileSync(pm, args, {
        stdio: "inherit",
        encoding: "utf-8",
        allowNonInteractive: true,
      });

      console.log(`Installed @tailwindcss/vite`);
    } catch (error) {
      throw new Error(
        `Failed to install @tailwindcss/vite: ${error}. Please install it manually with: ${pm} ${installCmd.join(" ")} ${devFlag} @tailwindcss/vite`,
      );
    }
  }

  // Locating the vite.config.ts file
  const viteConfigPath = [
    path.join(projectRoot, "vite.config.ts"),
    path.join(projectRoot, "vite.config.js"),
    path.join(projectRoot, "vite.config.mjs"),
    path.join(projectRoot, "vite.config.cjs"),
  ];
  const existingConfigPath = viteConfigPath.find((p) => fs.existsSync(p));

  // Now if that particular file exists
  if (existingConfigPath) {
    // Modify existing config
    const configContent = fs.readFileSync(existingConfigPath, "utf-8");
    const ext = path.extname(existingConfigPath);

    if (ext === ".ts") {
      // Use ts-morph for TypeScript files
      await modifyViteConfigTS(existingConfigPath, configContent);
    } else {
      // Use string manipulation for JS/MJS files
      const modified = modifyViteConfigJS(configContent, ext === ".mjs");
      if (modified !== configContent) {
        fs.writeFileSync(existingConfigPath, modified);
        console.log(
          `${chalk.green("✔")} Updated ${path.basename(existingConfigPath)}`,
        );
      }
    }
  } else {
    // Create new vite.config.ts
    const newConfigPath = path.join(projectRoot, "vite.config.ts");
    const defaultConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
   tailwindcss()],
})`;
    fs.writeFileSync(newConfigPath, defaultConfig);
    console.log(`${chalk.green("✔")} Created vite.config.ts`);
  }

  console.log(` Vite Tailwind plugin setup complete`);
}

async function modifyViteConfigTS(
  configPath: string,
  configContent: string,
): Promise<void> {
  const project = new Project({
    skipFileDependencyResolution: true,
    compilerOptions: { allowJs: true },
  });

  const sourceFile = project.createSourceFile("vite.config.ts", configContent, {
    scriptKind: ScriptKind.TS,
  });

  // Check if import already exists
  const existingImport = sourceFile
    .getImportDeclarations()
    .find((imp) => imp.getModuleSpecifierValue() === "@tailwindcss/vite");

  // Add import if it doesn't exist
  if (!existingImport) {
    // Find the last import or add at the top
    const imports = sourceFile.getImportDeclarations();
    const lastImport = imports[imports.length - 1];

    if (lastImport) {
      sourceFile.insertImportDeclaration(lastImport.getChildIndex() + 1, {
        defaultImport: "tailwindcss",
        moduleSpecifier: "@tailwindcss/vite",
      });
    } else {
      // No imports, add at the top
      sourceFile.insertImportDeclaration(0, {
        defaultImport: "tailwindcss",
        moduleSpecifier: "@tailwindcss/vite",
      });
    }
  }

  // Find the default export (can be export default or export default defineConfig(...))
  // Try finding export default statements directly (more reliable for TypeScript)
  const exportAssignment = sourceFile
    .getStatements()
    .find((stmt) => {
      if (stmt.getKind() === SyntaxKind.ExportAssignment) {
        const assignment = stmt.asKind(SyntaxKind.ExportAssignment);
        return assignment && !assignment.isExportEquals();
      }
      return false;
    })
    ?.asKind(SyntaxKind.ExportAssignment);

  let defaultExportDecl: unknown = null;

  if (exportAssignment) {
    defaultExportDecl = exportAssignment.getExpression();
  }

  // Fallback: try getExportedDeclarations if direct method didn't work
  if (!defaultExportDecl) {
    const exportedDecl = sourceFile
      .getExportedDeclarations()
      .get("default")?.[0];

    if (exportedDecl) {
      defaultExportDecl = exportedDecl;
    }
  }

  if (
    !defaultExportDecl ||
    typeof defaultExportDecl !== "object" ||
    !("getKindName" in defaultExportDecl) ||
    !("asKind" in defaultExportDecl)
  ) {
    throw new Error(
      `Could not find default export in vite.config.ts. Please ensure it has 'export default defineConfig({...})' or 'export default {...}'. File content:\n${configContent.substring(0, 200)}...`,
    );
  }

  // Handle different export patterns:
  let configObject: ObjectLiteralExpression | null = null;

  const node = defaultExportDecl as {
    getKindName: () => string;
    asKind: (kind: SyntaxKind) => unknown;
  };
  const kindName = node.getKindName();
  const asKind = node.asKind;

  if (kindName === "CallExpression") {
    // Case: export default defineConfig({ ... })
    const callExpr = asKind(SyntaxKind.CallExpression) as {
      getArguments: () => unknown[];
    } | null;
    const arg = callExpr?.getArguments()[0] as {
      getKindName: () => string;
      asKind: (kind: SyntaxKind) => unknown;
    } | null;
    if (arg?.getKindName() === "ObjectLiteralExpression") {
      configObject = arg.asKind(
        SyntaxKind.ObjectLiteralExpression,
      ) as ObjectLiteralExpression | null;
    }
  } else if (kindName === "ObjectLiteralExpression") {
    // Case: export default { ... }
    configObject = asKind(
      SyntaxKind.ObjectLiteralExpression,
    ) as ObjectLiteralExpression | null;
  } else if (kindName === "VariableDeclaration") {
    // Case: const config = { ... }; export default config;
    const varDecl = asKind(SyntaxKind.VariableDeclaration) as {
      getInitializer: () => unknown;
    } | null;
    const initializer = varDecl?.getInitializer() as {
      getKindName: () => string;
      asKind: (kind: SyntaxKind) => unknown;
    } | null;
    if (initializer?.getKindName() === "ObjectLiteralExpression") {
      configObject = initializer.asKind(
        SyntaxKind.ObjectLiteralExpression,
      ) as ObjectLiteralExpression | null;
    }
  }

  if (!configObject) {
    throw new Error(
      "Could not parse vite.config.ts structure. Please ensure it exports a config object.",
    );
  }

  // Check if plugins array exists
  const properties = configObject.getProperties();
  const pluginsProperty = properties.find((prop) => {
    if (prop.getKind() === SyntaxKind.PropertyAssignment) {
      const propAssignment = prop.asKind(SyntaxKind.PropertyAssignment);
      return propAssignment?.getName() === "plugins";
    }
    return false;
  });

  if (!pluginsProperty) {
    throw new Error(
      "plugins property not found. Please add 'plugins: [react(), tailwindcss()]' manually.",
    );
  }

  // Check if tailwindcss() is already in plugins array
  const propAssignment = pluginsProperty.asKind(SyntaxKind.PropertyAssignment);
  const pluginsValue = propAssignment?.getInitializer();
  if (pluginsValue?.getKindName() === "ArrayLiteralExpression") {
    const pluginsArray = pluginsValue.asKind(SyntaxKind.ArrayLiteralExpression);
    const hasTailwind = pluginsArray
      ?.getElements()
      .some((elem: { getText: () => string }) => {
        const text = elem.getText();
        return text.includes("tailwindcss()");
      });

    if (!hasTailwind && pluginsArray) {
      // Add tailwindcss() to the plugins array
      const lastElement =
        pluginsArray.getElements()[pluginsArray.getElements().length - 1];
      if (lastElement) {
        pluginsArray.insertElement(
          pluginsArray.getElements().length,
          "tailwindcss()",
        );
      } else {
        pluginsArray.addElement("tailwindcss()");
      }
    }
  }

  // Write the modified file
  const modifiedContent = sourceFile.getFullText();
  fs.writeFileSync(configPath, modifiedContent);
  console.log(`${chalk.green("✔")} Updated vite.config.ts`);
}

function modifyViteConfigJS(configContent: string, _isMJS: boolean): string {
  // Check if import already exists
  const hasImport = configContent.includes("@tailwindcss/vite");
  const hasTailwindPlugin = configContent.includes("tailwindcss()");

  if (hasImport && hasTailwindPlugin) {
    // Already configured
    return configContent;
  }

  let modified = configContent;

  // Add import if missing
  // Always use ES module import syntax for all JS files (Vite supports it)
  if (!hasImport) {
    const importStatement = `import tailwindcss from '@tailwindcss/vite'\n`;

    // Try to find where to insert (after other imports or at the top)
    const importRegex = /^(import|const|require).*$/m;
    const lastImportMatch = [
      ...modified.matchAll(new RegExp(importRegex.source, "gm")),
    ].pop();

    if (lastImportMatch) {
      const insertIndex =
        (lastImportMatch.index ?? 0) + lastImportMatch[0].length;
      modified =
        modified.slice(0, insertIndex) +
        "\n" +
        importStatement +
        modified.slice(insertIndex);
    } else {
      // No imports found, add at the top
      modified = importStatement + modified;
    }
  }

  // Add to plugins array
  if (!hasTailwindPlugin) {
    // Look for plugins array pattern: plugins: [ ... ]
    const pluginsArrayRegex = /plugins:\s*\[([^\]]*)\]/;
    const match = pluginsArrayRegex.exec(modified);

    if (match) {
      // Plugins array exists, add tailwindcss()
      const existingPlugins = match[1].trim();
      const newPlugins = existingPlugins
        ? `${existingPlugins}, tailwindcss()`
        : "tailwindcss()";
      modified = modified.replace(
        pluginsArrayRegex,
        `plugins: [${newPlugins}]`,
      );
    } else {
      // No plugins array, need to add it
      // Look for export default pattern
      const exportDefaultRegex = /export\s+default\s+(\{[\s\S]*\})/;
      const exportMatch = exportDefaultRegex.exec(modified);

      if (exportMatch) {
        // Insert plugins before the closing brace
        const configObject = exportMatch[1];
        const lastBraceIndex = configObject.lastIndexOf("}");
        const beforeBrace = configObject.slice(0, lastBraceIndex);
        const afterBrace = configObject.slice(lastBraceIndex);

        const pluginsProperty = beforeBrace.trim().endsWith(",")
          ? "\n  plugins: [tailwindcss()],"
          : ",\n  plugins: [tailwindcss()]";

        modified = modified.replace(
          exportDefaultRegex,
          `export default ${beforeBrace}${pluginsProperty}${afterBrace}`,
        );
      } else {
        throw new Error(
          "Could not find export default in vite.config. Please add plugins manually.",
        );
      }
    }
  }

  return modified;
}
