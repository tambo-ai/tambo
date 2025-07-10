import chalk from "chalk";
import deepEqual from "deep-equal";
import deepmerge from "deepmerge";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import postcss from "postcss";
import semver from "semver";
import type { Config } from "tailwindcss";
import { Project, ScriptKind } from "ts-morph";
import { fileURLToPath } from "url";
import { parseConfigObject } from "./tailwind/config/parsing.js";
import {
  extractUtilitiesFromLayer,
  extractV4Configuration,
  getTailwindVariables,
} from "./tailwind/css/extraction.js";
import {
  addCustomVariants,
  addUtilities,
  addVariables,
  addVariablesToLayer,
  addVariants,
  cssVariableExists,
  mergeTheme,
} from "./tailwind/css/modification.js";
import {
  handleInlineTheme,
  preserveConfigDirectives,
} from "./tailwind/v4/handlers.js";
import { detectTailwindVersion } from "./tailwind/version/detection.js";

// Get the current file URL and convert it to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up Tailwind CSS and global styles for the project
 * @param projectRoot The root directory of the project
 */
export async function setupTailwindandGlobals(projectRoot: string) {
  const tailwindConfigPath = path.join(projectRoot, "tailwind.config.ts");

  // Detect Tailwind version first
  const tailwindVersion = detectTailwindVersion(projectRoot);
  const isV4 = tailwindVersion && semver.gte(tailwindVersion, "4.0.0");

  if (tailwindVersion) {
    console.log(
      `${chalk.blue("ℹ")} Detected Tailwind CSS v${tailwindVersion}`,
    );
  } else {
    console.log(
      `${chalk.yellow("⚠")} Could not detect Tailwind CSS version, assuming v3`,
    );
  }

  // Detect if src directory exists
  const hasSrcDir = fs.existsSync(path.join(projectRoot, "src"));
  const appPath = hasSrcDir ? "src/app" : "app";

  // Create app directory if it doesn't exist
  const fullAppPath = path.join(projectRoot, appPath);
  fs.mkdirSync(fullAppPath, { recursive: true });

  // Set globals.css path based on project structure
  const globalsPath = path.join(projectRoot, appPath, "globals.css");

  const registryPath = path.join(__dirname, "../../../src/registry");
  const defaultTailwindConfig = path.join(
    registryPath,
    "config",
    "tailwind.config.ts",
  );

  // Choose the appropriate globals.css file based on Tailwind version
  const defaultGlobalsCSS = path.join(
    registryPath,
    "config",
    isV4 ? "globals-v4.css" : "globals-v3.css",
  );

  // Initialize flags to track if updates are needed
  let configUpdated = false;
  let globalsUpdated = false;

  // Only process tailwind.config.ts for v3 users
  if (!isV4) {
    // Handle tailwind.config.ts for v3
    if (!fs.existsSync(tailwindConfigPath)) {
      fs.copyFileSync(defaultTailwindConfig, tailwindConfigPath);
      console.log(`${chalk.green("✔")} Created tailwind.config.ts`);
    } else {
      // Merge logic for v3
      // Create a new TypeScript project
      const project = new Project({
        skipFileDependencyResolution: true,
        compilerOptions: { allowJs: true },
      });

      // Add both config files to the project
      const existingConfigFile = project.createSourceFile(
        "existing.ts",
        fs.readFileSync(tailwindConfigPath, "utf-8"),
        { scriptKind: ScriptKind.TS },
      );

      const defaultConfigFile = project.createSourceFile(
        "default.ts",
        fs.readFileSync(defaultTailwindConfig, "utf-8"),
        { scriptKind: ScriptKind.TS },
      );

      // Extract config objects
      const existingConfig = existingConfigFile
        .getVariableDeclaration("config")
        ?.getInitializer()
        ?.getText();

      const defaultConfig = defaultConfigFile
        .getVariableDeclaration("config")
        ?.getInitializer()
        ?.getText();

      if (existingConfig && defaultConfig) {
        try {
          const existing = parseConfigObject(existingConfig, "existing");
          const defaults = parseConfigObject(defaultConfig, "default");

          // Deep merge the configurations, with existing taking precedence
          const merged = deepmerge(defaults, existing, {
            arrayMerge: (target, source) => [
              ...new Set([...target, ...source]),
            ],
          }) as Config;

          // Update the theme colors specifically
          if (defaults.theme?.colors) {
            merged.theme ??= {};
            merged.theme.colors = {
              ...merged.theme.colors,
              ...defaults.theme.colors,
            };
          }

          // Write back the merged config with error handling
          const formattedConfig = `import type { Config } from 'tailwindcss'

const config: Config = ${JSON.stringify(merged, null, 2)}

export default config`;

          // Only update and log if there were actual changes
          if (!deepEqual(existing, merged)) {
            try {
              // Create backup of existing config
              if (fs.existsSync(tailwindConfigPath)) {
                fs.copyFileSync(
                  tailwindConfigPath,
                  `${tailwindConfigPath}.backup`,
                );
              }

              // Write new config
              fs.writeFileSync(tailwindConfigPath, formattedConfig);
              configUpdated = true;

              // Remove backup if successful
              if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
                fs.unlinkSync(`${tailwindConfigPath}.backup`);
              }
            } catch (error) {
              // Restore from backup if available
              if (fs.existsSync(`${tailwindConfigPath}.backup`)) {
                fs.copyFileSync(
                  `${tailwindConfigPath}.backup`,
                  tailwindConfigPath,
                );
                fs.unlinkSync(`${tailwindConfigPath}.backup`);
              }
              throw error;
            }
          }
        } catch (error) {
          throw new Error(`Failed to merge configs: ${error}`);
        }
      }
    }
  } else {
    // For v4, maybe just inform the user
    console.log(`${chalk.blue("ℹ")} Tailwind v4 uses CSS-first configuration`);
  }

  if (configUpdated) {
    console.log(`${chalk.green("✔")} Updated tailwind.config.ts`);
  }

  // Handle globals.css with careful preservation of user content
  fs.mkdirSync(path.dirname(globalsPath), { recursive: true });

  if (!fs.existsSync(globalsPath)) {
    // If no globals.css exists, create it from the appropriate template
    fs.copyFileSync(defaultGlobalsCSS, globalsPath);
    console.log(`${chalk.green("✔")} Created globals.css`);
  } else {
    // Existing globals.css - ask for permission before modifying
    const existingCSS = fs.readFileSync(globalsPath, "utf-8");
    const existingRoot = postcss.parse(existingCSS);

    // Get the appropriate variables for this Tailwind version from registry files
    const { rootVars, darkVars } = getTailwindVariables(tailwindVersion);

    // Ask user for confirmation before making CSS changes
    console.log(
      `\n${chalk.yellow("⚠")} Tambo needs to add CSS variables to your globals.css file.`,
    );
    console.log(
      `${chalk.blue("ℹ")} This will preserve your existing styles and only add missing variables.`,
    );

    const { proceedWithCss } = await inquirer.prompt({
      type: "confirm",
      name: "proceedWithCss",
      message: "Allow Tambo to modify your globals.css file?",
      default: true,
    });

    if (!proceedWithCss) {
      console.log(`\n${chalk.yellow("⚠")} CSS modifications skipped.`);

      // Check what variables would have been added
      let hasMissingVariables = false;
      const missingRootVars = new Map<string, string>();
      const missingDarkVars = new Map<string, string>();

      if (isV4) {
        // Extract all v4 configuration from registry
        const v4Config = extractV4Configuration(defaultGlobalsCSS);

        // Check for missing variables
        v4Config.variables.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ":root", prop)) {
            missingRootVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        v4Config.darkVariables.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ".dark", prop)) {
            missingDarkVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        // Check for missing theme mappings
        const hasInlineTheme = existingRoot.nodes.some(
          (node): node is postcss.AtRule =>
            node.type === "atrule" &&
            node.name === "theme" &&
            node.params === "inline",
        );

        if (!hasInlineTheme) {
          hasMissingVariables = true;
        }

        // Check for missing custom variants
        const hasMissingCustomVariants =
          v4Config.customVariants.size > 0 &&
          !Array.from(v4Config.customVariants.keys()).every((name) =>
            existingRoot.nodes.some(
              (node): node is postcss.AtRule =>
                node.type === "atrule" &&
                node.name === "custom-variant" &&
                node.params.startsWith(name),
            ),
          );

        if (hasMissingCustomVariants) {
          hasMissingVariables = true;
          console.log(
            `\n${chalk.bold("Missing @custom-variant definitions:")}`,
          );
          v4Config.customVariants.forEach((definition, name) => {
            console.log(
              `  ${chalk.cyan(`@custom-variant ${name} ${definition}`)}`,
            );
          });
        }
      } else {
        // v3 - check for missing variables
        rootVars.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ":root", prop)) {
            missingRootVars.set(prop, value);
            hasMissingVariables = true;
          }
        });

        darkVars.forEach((value, prop) => {
          if (!cssVariableExists(existingRoot, ".dark", prop)) {
            missingDarkVars.set(prop, value);
            hasMissingVariables = true;
          }
        });
      }

      if (hasMissingVariables) {
        console.log(
          `\n${chalk.blue("ℹ")} Missing CSS variables that tambo components need:`,
        );

        if (missingRootVars.size > 0) {
          console.log(`\n${chalk.bold("Missing :root variables:")}`);
          missingRootVars.forEach((value, prop) => {
            console.log(`  ${chalk.cyan(prop)}: ${chalk.gray(value)}`);
          });
        }

        if (missingDarkVars.size > 0) {
          console.log(`\n${chalk.bold("Missing .dark variables:")}`);
          missingDarkVars.forEach((value, prop) => {
            console.log(`  ${chalk.cyan(prop)}: ${chalk.gray(value)}`);
          });
        }

        if (isV4) {
          const hasInlineTheme = existingRoot.nodes.some(
            (node): node is postcss.AtRule =>
              node.type === "atrule" &&
              node.name === "theme" &&
              node.params === "inline",
          );

          if (!hasInlineTheme) {
            console.log(
              `\n${chalk.bold("Missing @theme inline block needed")}`,
            );
          }
        }

        console.log(
          `\n${chalk.blue("ℹ")} Setup guide: ${chalk.underline("https://tambo.co/docs")}`,
        );
      } else {
        console.log(
          `\n${chalk.green("✔")} All required CSS variables are already present in your globals.css!`,
        );
        console.log(
          `${chalk.blue("ℹ")} Your tambo components should work without any additional setup.`,
        );
      }

      return; // Exit early without making changes
    }

    // User confirmed, proceed with CSS modifications
    console.log(`${chalk.green("✔")} Proceeding with CSS modifications...`);

    // Check if user is using Tailwind v4 format and we have v4 variables
    if (isV4) {
      console.log(
        `${chalk.blue("ℹ")} Using Tailwind v4 CSS-first configuration`,
      );

      // Extract all v4 configuration from registry
      const v4Config = extractV4Configuration(defaultGlobalsCSS);

      // Preserve user's existing @config directives
      preserveConfigDirectives(existingRoot);

      // Handle @theme inline blocks
      handleInlineTheme(existingRoot);

      // Merge theme variables
      mergeTheme(existingRoot, v4Config.themeVars);

      // Add missing CSS variables
      addVariables(existingRoot, ":root", v4Config.variables);
      addVariables(existingRoot, ".dark", v4Config.darkVariables);

      // Add missing variants (old @variant syntax)
      addVariants(existingRoot, v4Config.variants);

      // Add missing custom variants (new @custom-variant syntax)
      addCustomVariants(existingRoot, v4Config.customVariants);
    } else {
      // For v3, use the traditional approach with @layer base
      console.log(
        `${chalk.blue("ℹ")} Using Tailwind v3 format for CSS variables`,
      );

      // Find or create @layer base
      let baseLayer = existingRoot.nodes.find(
        (node): node is postcss.AtRule =>
          node.type === "atrule" &&
          node.name === "layer" &&
          node.params === "base",
      );

      if (!baseLayer) {
        baseLayer = postcss.atRule({
          name: "layer",
          params: "base",
          raws: { before: "\n\n", after: "\n" },
        });
        existingRoot.append(baseLayer);
      }

      // Add variables INSIDE the @layer base block
      // Add missing root variables
      addVariablesToLayer(baseLayer, ":root", rootVars);

      // Add missing dark variables
      addVariablesToLayer(baseLayer, ".dark", darkVars);

      // Handle utilities layer for v3
      const registryUtilities = extractUtilitiesFromLayer(defaultGlobalsCSS);
      addUtilities(existingRoot, registryUtilities);
    }

    // Write updated CSS only if there were changes
    const updatedCSS = existingRoot.toString();
    if (existingCSS !== updatedCSS) {
      // Create backup before making changes
      fs.writeFileSync(`${globalsPath}.backup`, existingCSS);

      try {
        fs.writeFileSync(globalsPath, updatedCSS);
        globalsUpdated = true;

        // Remove backup if successful
        fs.unlinkSync(`${globalsPath}.backup`);
      } catch (error) {
        // Restore from backup if write fails
        fs.copyFileSync(`${globalsPath}.backup`, globalsPath);
        fs.unlinkSync(`${globalsPath}.backup`);
        throw error;
      }
    }
  }

  if (globalsUpdated) {
    console.log(
      `${chalk.green("✔")} Updated globals.css (preserved existing content)`,
    );
  }
}
