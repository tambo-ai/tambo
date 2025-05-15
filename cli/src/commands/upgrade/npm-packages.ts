import { execSync } from "child_process";
import fs from "fs";
import ora from "ora";
import path from "path";
import type { UpgradeOptions } from "./index.js";

/**
 * Upgrade npm packages that components rely on
 */
export async function upgradeNpmPackages(
  options: UpgradeOptions,
): Promise<boolean> {
  const spinner = ora("Upgrading npm packages...").start();

  try {
    // Read package.json to identify dependencies
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail("No package.json found in the current directory");
      return false;
    }

    // Execute npm update to upgrade dependencies
    const npmFlags = options.legacyPeerDeps ? " --legacy-peer-deps" : "";

    execSync(`npm update${npmFlags}`, {
      stdio: options.silent ? "ignore" : "inherit",
    });

    spinner.succeed("Successfully upgraded npm packages");
    return true;
  } catch (error) {
    spinner.fail(`Failed to upgrade npm packages: ${error}`);
    return false;
  }
}
