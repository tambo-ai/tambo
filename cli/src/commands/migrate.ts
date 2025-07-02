import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import {
  COMPONENT_SUBDIR,
  LEGACY_COMPONENT_SUBDIR,
} from "../constants/paths.js";
import { getTamboComponentInfo } from "./add/utils.js";
import { getInstallationPath } from "./init.js";

interface MigrateOptions {
  yes?: boolean;
  dryRun?: boolean;
}

/**
 * Updates import paths in a file from old to new location
 */
function updateImportPaths(content: string): string {
  // Update imports from @/components/ui/ to @/components/tambo/
  return content.replace(
    /@\/components\/ui\//g,
    `@/components/${COMPONENT_SUBDIR}/`,
  );
}

/**
 * Migrates components from legacy to new location
 */
export async function handleMigrate(options: MigrateOptions = {}) {
  try {
    const installPath = await getInstallationPath(options.yes);
    const legacyPath = path.join(
      process.cwd(),
      installPath,
      LEGACY_COMPONENT_SUBDIR,
    );
    const newPath = path.join(process.cwd(), installPath, COMPONENT_SUBDIR);

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
          const { proceed } = await inquirer.prompt({
            type: "confirm",
            name: "proceed",
            message: "Continue migration? (may overwrite existing files)",
            default: false,
          });

          if (!proceed) {
            console.log(chalk.gray("Migration cancelled."));
            return;
          }
        }
      }
    }

    if (options.dryRun) {
      console.log(chalk.gray("\n--dry-run mode: No files will be modified.\n"));
      console.log(chalk.gray("Would perform the following actions:\n"));
      console.log(chalk.gray(`1. Create directory: ${newPath}`));
      console.log(chalk.gray(`2. Move ${componentFiles.length} files`));
      console.log(chalk.gray(`3. Update import paths in all moved files`));
      console.log(chalk.gray(`4. Remove empty directory: ${legacyPath}`));
      return;
    }

    if (!options.yes) {
      const { confirm } = await inquirer.prompt({
        type: "confirm",
        name: "confirm",
        message: `Migrate ${componentFiles.length} components from ${LEGACY_COMPONENT_SUBDIR}/ to ${COMPONENT_SUBDIR}/?`,
        default: true,
      });

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
      for (const file of componentFiles) {
        try {
          const oldFile = path.join(legacyPath, file);
          const newFile = path.join(newPath, file);

          // Read content and update import paths
          const content = fs.readFileSync(oldFile, "utf-8");
          const updatedContent = updateImportPaths(content);

          // Write to new location
          fs.writeFileSync(newFile, updatedContent);

          // Remove old file
          fs.unlinkSync(oldFile);

          successCount++;
        } catch (error) {
          errors.push(`${file}: ${error}`);
        }
      }

      // Also update other support files (markdownComponents.tsx, etc)
      const supportFiles = ["markdownComponents.tsx", "tooltip.tsx"];
      for (const file of supportFiles) {
        const oldFile = path.join(legacyPath, file);
        if (fs.existsSync(oldFile)) {
          try {
            const content = fs.readFileSync(oldFile, "utf-8");
            const updatedContent = updateImportPaths(content);
            fs.writeFileSync(path.join(newPath, file), updatedContent);
            fs.unlinkSync(oldFile);
          } catch (_error) {
            // Non-critical, continue
          }
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
          `\n✨ Successfully migrated ${successCount} components to ${COMPONENT_SUBDIR}/`,
        ),
      );

      // Show next steps
      console.log(chalk.blue("\n📝 Next steps:"));
      console.log(chalk.gray("1. Update your imports in non-component files:"));
      console.log(
        chalk.gray(
          `   From: @/components/${LEGACY_COMPONENT_SUBDIR}/component-name`,
        ),
      );
      console.log(
        chalk.gray(`   To:   @/components/${COMPONENT_SUBDIR}/component-name`),
      );
      console.log(
        chalk.gray(
          "\n2. Update your tambo.ts file if you have custom components registered",
        ),
      );
      console.log(chalk.gray("\n3. Restart your development server"));
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
