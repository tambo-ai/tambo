import chalk from "chalk";
import fs from "fs";
import path from "path";
import { getInstalledComponents } from "../add/utils.js";
import { getInstallationPath } from "../init.js";

/**
 * Lists all installed components in the project
 */
export async function handleListComponents(prefix?: string) {
  try {
    // 1. Check package.json
    if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
      throw new Error(
        "No package.json found. Please run this command in your project root.",
      );
    }

    // 2. Get installation path
    const installPath = prefix ?? (await getInstallationPath());
    const isExplicitPrefix = Boolean(prefix);

    // 3. Get all installed components (tambo components only)
    const tamboComponents = await getInstalledComponents(
      installPath,
      isExplicitPrefix,
    );

    // 4. Get all .tsx files in the components directory (including non-tambo)
    const componentsPath = isExplicitPrefix
      ? path.join(process.cwd(), installPath)
      : path.join(process.cwd(), installPath, "ui");
    let allComponents: string[] = [];

    if (fs.existsSync(componentsPath)) {
      const files = fs.readdirSync(componentsPath);
      allComponents = files
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""));
    }

    if (allComponents.length === 0) {
      console.log(chalk.blue("ℹ No components installed yet."));
      return;
    }

    // 5. Display components with distinction between tambo and non-tambo
    console.log(chalk.blue("\nℹ Installed components:"));

    if (tamboComponents.length > 0) {
      console.log(chalk.green("\n  Tambo components:"));
      tamboComponents.forEach((component) => {
        console.log(`    - ${component}`);
      });
    }

    const nonTamboComponents = allComponents.filter(
      (comp) => !tamboComponents.includes(comp),
    );
    if (nonTamboComponents.length > 0) {
      console.log(chalk.gray("\n  Other components:"));
      nonTamboComponents.forEach((component) => {
        console.log(chalk.gray(`    - ${component}`));
      });
    }

    console.log(
      `\nTotal: ${allComponents.length} component(s) (${tamboComponents.length} from tambo)`,
    );
  } catch (error) {
    console.log(chalk.red(`\n✖ Failed to list components: ${error}`));
    throw error;
  }
}
