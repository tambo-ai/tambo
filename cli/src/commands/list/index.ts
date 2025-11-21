import chalk from "chalk";
import fs from "fs";
import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../../constants/paths.js";
import { getTamboComponentInfo } from "../add/utils.js";
import { getInstallationPath } from "../init.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
} from "../shared/path-utils.js";

export interface ListOptions {
  prefix?: string;
  yes?: boolean;
}

/**
 * Lists all installed components in the project
 */
export async function handleListComponents(options: ListOptions = {}) {
  try {
    const { prefix, yes } = options;

    // 1. Check package.json
    if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in your project root.",
      );
    }

    // 2. Get installation path
    const installPath = prefix ?? (await getInstallationPath(yes));
    const isExplicitPrefix = Boolean(prefix);

    // 3. Get detailed Tambo component information
    const { mainComponents, supportComponents } = getTamboComponentInfo();

    // 4. Get all .tsx files in both component directories
    const projectRoot = process.cwd();
    const componentsPath = getComponentDirectoryPath(
      projectRoot,
      installPath,
      isExplicitPrefix,
    );

    const legacyPath = !isExplicitPrefix
      ? getLegacyComponentDirectoryPath(projectRoot, installPath)
      : null;

    // Categorize components by location and type
    const categorizedComponents = {
      new: {
        main: [] as string[],
        support: [] as string[],
        custom: [] as string[],
      },
      legacy: {
        main: [] as string[],
        support: [] as string[],
        custom: [] as string[],
      },
    };

    // Check new location
    if (fs.existsSync(componentsPath)) {
      const files = fs.readdirSync(componentsPath);
      files
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""))
        .forEach((name) => {
          if (mainComponents.has(name)) {
            categorizedComponents.new.main.push(name);
          } else if (supportComponents.has(name)) {
            categorizedComponents.new.support.push(name);
          } else {
            categorizedComponents.new.custom.push(name);
          }
        });
    }

    // Check legacy location
    if (legacyPath && fs.existsSync(legacyPath)) {
      const files = fs.readdirSync(legacyPath);
      files
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""))
        .forEach((name) => {
          if (mainComponents.has(name)) {
            categorizedComponents.legacy.main.push(name);
          } else if (supportComponents.has(name)) {
            categorizedComponents.legacy.support.push(name);
          } else {
            categorizedComponents.legacy.custom.push(name);
          }
        });
    }

    // Calculate totals
    const totalNew =
      categorizedComponents.new.main.length +
      categorizedComponents.new.support.length +
      categorizedComponents.new.custom.length;
    const totalLegacy =
      categorizedComponents.legacy.main.length +
      categorizedComponents.legacy.support.length +
      categorizedComponents.legacy.custom.length;
    const totalComponents = totalNew + totalLegacy;

    if (totalComponents === 0) {
      console.log(chalk.blue("ℹ No components installed yet."));
      return;
    }

    // 5. Display components with location and type info
    console.log(chalk.blue("\nℹ Installed components:"));

    // Show components in new location
    if (totalNew > 0) {
      console.log(chalk.green(`\n  In ${COMPONENT_SUBDIR}/:`));

      if (categorizedComponents.new.main.length > 0) {
        console.log(chalk.cyan(`    Tambo components:`));
        categorizedComponents.new.main.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }

      if (categorizedComponents.new.support.length > 0) {
        console.log(chalk.cyan(`    Tambo support components:`));
        categorizedComponents.new.support.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }

      if (categorizedComponents.new.custom.length > 0) {
        console.log(chalk.yellow(`    Custom components:`));
        categorizedComponents.new.custom.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }
    }

    // Show components in legacy location
    if (totalLegacy > 0) {
      console.log(
        chalk.yellow(`\n  In ${LEGACY_COMPONENT_SUBDIR}/ (legacy location):`),
      );

      if (categorizedComponents.legacy.main.length > 0) {
        console.log(chalk.cyan(`    Tambo components:`));
        categorizedComponents.legacy.main.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }

      if (categorizedComponents.legacy.support.length > 0) {
        console.log(chalk.cyan(`    Tambo support components:`));
        categorizedComponents.legacy.support.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }

      if (categorizedComponents.legacy.custom.length > 0) {
        console.log(chalk.yellow(`    Custom components:`));
        categorizedComponents.legacy.custom.forEach((component) => {
          console.log(`      - ${component}`);
        });
      }

      // Only show migration instructions if there are Tambo components in legacy location
      const legacyTamboComponents =
        categorizedComponents.legacy.main.length +
        categorizedComponents.legacy.support.length;
      if (legacyTamboComponents > 0) {
        console.log(
          chalk.gray(
            `\n  💡 To migrate to the new directory structure:` +
              `\n     1. Move all files from ${LEGACY_COMPONENT_SUBDIR}/ to ${COMPONENT_SUBDIR}/` +
              `\n     2. Update imports: @/components/${LEGACY_COMPONENT_SUBDIR}/ → @/components/${COMPONENT_SUBDIR}/` +
              `\n     3. Update any custom components in tambo.ts` +
              `\n\n   or you can run ${chalk.bold("npx tambo migrate")} to migrate all components to the new location`,
          ),
        );
      }
    }

    // Show summary
    const totalTambo =
      categorizedComponents.new.main.length +
      categorizedComponents.new.support.length +
      categorizedComponents.legacy.main.length +
      categorizedComponents.legacy.support.length;
    const totalCustom =
      categorizedComponents.new.custom.length +
      categorizedComponents.legacy.custom.length;

    console.log(
      chalk.blue(
        `\nTotal: ${totalComponents} component(s) ` +
          `(${totalTambo} from Tambo, ${totalCustom} custom)`,
      ),
    );
  } catch (error) {
    console.log(chalk.red(`\n✖ Failed to list components: ${error}`));
    throw error;
  }
}
