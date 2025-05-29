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

    // First, try to install npm-check-updates if not available
    spinner.text = "Checking for npm-check-updates...";
    try {
      execSync("npx --version", { stdio: "ignore" });
    } catch {
      spinner.fail("npx is required but not available");
      return false;
    }

    // Use npm-check-updates in interactive mode to let users choose updates
    spinner.text = "Checking for package updates...";
    spinner.stop();

    const ncuFlags = [
      "--upgrade",
      "--target",
      "latest",
      "--interactive",
      "--timeout",
      "60000",
    ];

    execSync(`npx npm-check-updates ${ncuFlags.join(" ")}`, {
      stdio: "inherit",
    });

    // Now install the updated dependencies
    const installSpinner = ora("Installing updated packages...").start();
    const npmFlags = options.legacyPeerDeps ? " --legacy-peer-deps" : "";

    execSync(`npm install${npmFlags}`, {
      stdio: options.silent ? "ignore" : "inherit",
    });

    console.log("\n");
    installSpinner.succeed("Successfully upgraded npm packages\n");
    return true;
  } catch (error) {
    spinner.fail(`Failed to upgrade npm packages: ${error}`);
    return false;
  }
}
