import chalk from "chalk";
import path from "path";
import fs from "fs";
import ora from "ora";
import { interactivePrompt } from "../utils/interactive.js";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../constants/paths.js";
import { getTamboComponentInfo } from "./add/utils.js";
import { getInstallationPath } from "./init.js";
import {
  getComponentDirectoryPath,
  getLegacyComponentDirectoryPath,
  getComponentFilePath,
} from "./shared/path-utils.js";

interface MigrateOptions {
  yes?: boolean;
  dryRun?: boolean;
}

/**
 * Updates import paths in a file between ui/ and tambo/ locations
 * Also transforms @tambo-ai/ui-registry/* imports to user project paths
 * @param content File content to update
 * @param targetLocation Target location: 'tambo' (default) or 'ui'
 */
export function updateImportPaths(
  content: string,
  targetLocation: "tambo" | "ui" = "tambo",
): string {
  let result = content;

  // Transform @tambo-ai/ui-registry imports to user project paths
  // These are the imports used in the centralized ui-registry package
  const componentSubdir =
    targetLocation === "tambo" ? COMPONENT_SUBDIR : LEGACY_COMPONENT_SUBDIR;

  // @tambo-ai/ui-registry/utils -> @/lib/utils
  result = result.replace(/@tambo-ai\/ui-registry\/utils/g, "@/lib/utils");

  // @tambo-ai/ui-registry/lib/* -> @/lib/*
  result = result.replace(/@tambo-ai\/ui-registry\/lib\//g, "@/lib/");

  // @tambo-ai/ui-registry/components/* -> @/components/tambo/* (or ui/)
  result = result.replace(
    /@tambo-ai\/ui-registry\/components\//g,
    `@/components/${componentSubdir}/`,
  );

  // Also handle legacy @/components/ui/ -> @/components/tambo/ transformations
  if (targetLocation === "tambo") {
    result = result.replace(
      /@\/components\/ui\//g,
      `@/components/${COMPONENT_SUBDIR}/`,
    );
  } else {
    result = result.replace(
      new RegExp(`@/components/${COMPONENT_SUBDIR}/`, "g"),
      `@/components/${LEGACY_COMPONENT_SUBDIR}/`,
    );
  }

  return result;
}

/**
 * Migrates components from legacy to new location
 */
export async function handleMigrate(options: MigrateOptions = {}) {
  try {
    const projectRoot = process.cwd();
    const installPath = await getInstallationPath(options.yes);
    const legacyPath = getLegacyComponentDirectoryPath(
      projectRoot,
      installPath,
    );
    const newPath = getComponentDirectoryPath(projectRoot, installPath, false);

    if (!fs.existsSync(legacyPath)) {
      console.log(chalk.blue("ℹ No components found in legacy location."));
      return;
    }

    const files = fs.readdirSync(legacyPath);
    const componentFiles = files.filter((f) => f.endsWith(".tsx"));

    if (componentFiles.length === 0) {
      console.log(chalk.blue("ℹ No components found to migrate."));
      return;
    }

    // Get detailed component information
    const { mainComponents, supportComponents } = getTamboComponentInfo();

    // Categorize components
    const mainTamboComponents: string[] = [];
    const supportTamboComponents: string[] = [];
    const customComponents: string[] = [];

    componentFiles.forEach((file) => {
      const componentName = file.replace(".tsx", "");
      if (mainComponents.has(componentName)) {
        mainTamboComponents.push(file);
      } else if (supportComponents.has(componentName)) {
        supportTamboComponents.push(file);
      } else {
        customComponents.push(file);
      }
    });

    // Display categorized components
    console.log(
      chalk.blue(`\nFound ${componentFiles.length} components to migrate:`),
    );

    if (mainTamboComponents.length > 0) {
      console.log(
        chalk.green(`  Tambo components (${mainTamboComponents.length}):`),
      );
      mainTamboComponents.forEach((file) => console.log(`    - ${file}`));
    }

    if (supportTamboComponents.length > 0) {
      console.log(
        chalk.cyan(
          `  Tambo support components (${supportTamboComponents.length}):`,
        ),
      );
      supportTamboComponents.forEach((file) => console.log(`    - ${file}`));
    }

    if (customComponents.length > 0) {
      console.log(
        chalk.yellow(`  Custom components (${customComponents.length}):`),
      );
      customComponents.forEach((file) => console.log(`    - ${file}`));
    }

    // Check if new location already has components
    if (fs.existsSync(newPath)) {
      const newFiles = fs
        .readdirSync(newPath)
        .filter((f) => f.endsWith(".tsx"));
      if (newFiles.length > 0) {
        console.log(
          chalk.yellow(
            `⚠️  Found existing components in ${COMPONENT_SUBDIR}/:\n` +
              newFiles.map((f) => `   - ${f}`).join("\n"),
          ),
        );

        if (!options.yes) {
          const { proceed } = await interactivePrompt<{ proceed: boolean }>(
            {
              type: "confirm",
              name: "proceed",
              message: "Continue migration? (may overwrite existing files)",
              default: false,
            },
            chalk.yellow("Use --yes flag to auto-proceed with migration."),
          );

          if (!proceed) {
            console.log(chalk.gray("Migration cancelled."));
            return;
          }
        }
      }
    }

    // Calculate Tambo files count early
    const tamboFiles = [...mainTamboComponents, ...supportTamboComponents];

    // Update dry-run
    if (options.dryRun) {
      console.log(chalk.gray("\n--dry-run mode: No files will be modified.\n"));
      console.log(chalk.gray("Would perform the following actions:\n"));
      console.log(chalk.gray(`1. Create directory: ${newPath}`));
      console.log(
        chalk.gray(`2. Move ${tamboFiles.length} Tambo component files`),
      );
      if (customComponents.length > 0) {
        console.log(
          chalk.gray(
            `3. Leave ${customComponents.length} custom components in ${LEGACY_COMPONENT_SUBDIR}/`,
          ),
        );
      }
      console.log(chalk.gray(`4. Update import paths in moved files`));
      console.log(chalk.gray(`5. Remove empty directory: ${legacyPath}`));
      return;
    }

    if (!options.yes) {
      const { confirm } = await interactivePrompt<{ confirm: boolean }>(
        {
          type: "confirm",
          name: "confirm",
          message: `Migrate ${tamboFiles.length} Tambo components from ${LEGACY_COMPONENT_SUBDIR}/ to ${COMPONENT_SUBDIR}/?`,
          default: true,
        },
        chalk.yellow("Use --yes flag to auto-proceed with migration."),
      );

      if (!confirm) {
        console.log(chalk.gray("Migration cancelled."));
        return;
      }
    }

    const spinner = ora("Migrating components...").start();

    try {
      // Create new directory
      fs.mkdirSync(newPath, { recursive: true });

      let successCount = 0;
      const errors: string[] = [];

      // Move files and update imports
      for (const file of tamboFiles) {
        try {
          const { name: componentName } = path.parse(file);
          const oldFile = getComponentFilePath(legacyPath, componentName);
          const newFile = getComponentFilePath(newPath, componentName);

          // Read content and update import paths
          const content = fs.readFileSync(oldFile, "utf-8");
          const updatedContent = updateImportPaths(content, "tambo");

          // Write to new location
          fs.writeFileSync(newFile, updatedContent);

          // Remove old file
          fs.unlinkSync(oldFile);

          successCount++;
        } catch (error) {
          errors.push(`${file}: ${error}`);
        }
      }

      // Remove old directory if empty
      try {
        const remainingFiles = fs.readdirSync(legacyPath);
        if (remainingFiles.length === 0) {
          fs.rmdirSync(legacyPath);
        }
      } catch (_error) {
        // Non-critical, continue
      }

      spinner.succeed(`Migration complete! Moved ${successCount} components.`);

      if (errors.length > 0) {
        console.log(chalk.yellow("\n⚠️  Some files had errors:"));
        errors.forEach((err) => console.log(chalk.red(`   - ${err}`)));
      }

      console.log(
        chalk.green(
          `\n✨ Successfully migrated ${successCount} Tambo components to ${COMPONENT_SUBDIR}/`,
        ),
      );

      if (customComponents.length > 0) {
        console.log(
          chalk.blue(
            `\nℹ️  ${customComponents.length} custom component${customComponents.length > 1 ? "s" : ""} remain${customComponents.length === 1 ? "s" : ""} in ${LEGACY_COMPONENT_SUBDIR}/`,
          ),
        );
        customComponents.forEach((file) => console.log(`    - ${file}`));
      }

      // Show next steps
      console.log(chalk.blue("\n📝 Next steps:"));
      console.log(chalk.gray("1. Update your imports in non-component files:"));
      console.log(
        chalk.gray(
          `   From: @/components/${LEGACY_COMPONENT_SUBDIR}/tambo-component-name`,
        ),
      );
      console.log(
        chalk.gray(
          `   To:   @/components/${COMPONENT_SUBDIR}/tambo-component-name`,
        ),
      );
      console.log(
        chalk.gray(
          `\n2. Custom components remain in ${LEGACY_COMPONENT_SUBDIR}/ - update imports as needed`,
        ),
      );
      console.log(
        chalk.gray(
          "\n3. Update your tambo.ts file if you have custom components registered",
        ),
      );
      console.log(chalk.gray("\n4. Restart your development server"));
    } catch (error) {
      spinner.fail(`Migration failed: ${error}`);
      console.log(
        chalk.red("\n❌ Migration failed. Your files have not been modified."),
      );
    }
  } catch (error) {
    console.error(chalk.red(`Migration error: ${error}`));
    process.exit(1);
  }
}
