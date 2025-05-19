import chalk from "chalk";
import fs from "fs";
import path from "path";
import { getInstallationPath } from "../init.js";

/**
 * Lists all installed components in the project
 */
export async function handleListComponents() {
  try {
    // 1. Check package.json
    if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in your project root.",
      );
    }

    // 2. Get installation path
    const installPath = await getInstallationPath();
    const componentsPath = path.join(process.cwd(), installPath, "ui");

    // 3. Check if components directory exists
    if (!fs.existsSync(componentsPath)) {
      console.log(chalk.blue("ℹ No components installed yet."));
      return;
    }

    // 4. Read all component files
    const files = fs.readdirSync(componentsPath);
    const components = files
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => file.replace(".tsx", ""));

    if (components.length === 0) {
      console.log(chalk.blue("ℹ No components installed yet."));
      return;
    }

    // 5. Display components
    console.log(chalk.blue("\nℹ Installed components:"));
    // add a note that not all of these components are from tambo
    components.forEach((component) => {
      console.log(`  - ${component}`);
    });
    console.log(`\nTotal: ${components.length} component(s)`);
    console.log(
      chalk.gray("Note: Some of these components may be from other libraries."),
    );
  } catch (error) {
    console.log(chalk.red(`\n✖ Failed to list components: ${error}`));
    throw error;
  }
}
