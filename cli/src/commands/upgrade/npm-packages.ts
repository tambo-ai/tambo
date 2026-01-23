import fs from "fs";
import ora from "ora";
import path from "path";
import { KNOWN_SAFE_PACKAGES } from "../../constants/packages.js";
import { execFileSync } from "../../utils/interactive.js";
import {
  detectPackageManager,
  getInstallCommand,
  getPackageRunnerArgs,
} from "../../utils/package-manager.js";
import type { UpgradeOptions } from "./index.js";

/**
 * Upgrade npm packages that components rely on
 */
export async function upgradeNpmPackages(
  options: UpgradeOptions,
): Promise<boolean> {
  const pm = detectPackageManager();
  const spinner = ora(`Upgrading packages using ${pm}...`).start();
  const allowNonInteractive = Boolean(options.yes);

  try {
    // Read package.json to identify dependencies
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail("No package.json found in the current directory");
      return false;
    }

    // Get the package runner for this package manager
    const [runnerCmd, runnerArgs] = getPackageRunnerArgs(pm);

    // First, check if the package runner is available
    spinner.text = `Checking for ${runnerCmd}...`;
    try {
      execFileSync(runnerCmd, ["--version"], {
        stdio: "ignore",
        allowNonInteractive,
      });
    } catch {
      spinner.fail(`${runnerCmd} is required but not available`);
      return false;
    }

    // Read the current package.json to see what's actually installed
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const allDeps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    // Filter to only show updates for known safe packages that are actually installed
    const installedSafePackages = KNOWN_SAFE_PACKAGES.filter(
      (pkg) => allDeps[pkg],
    );

    if (installedSafePackages.length === 0) {
      spinner.info("No packages found to update. Skipping package updates.");
      return true;
    }
    spinner.stop();

    const ncuArgs = [
      ...runnerArgs,
      "npm-check-updates",
      "--upgrade",
      "--target",
      "latest",
      ...(allowNonInteractive ? [] : ["--interactive"]),
      "--timeout",
      "60000",
      "--filter",
      installedSafePackages.join(","),
    ];

    execFileSync(runnerCmd, ncuArgs, {
      stdio: "inherit",
      allowNonInteractive,
    });

    // Now install the updated dependencies
    const installSpinner = ora("Installing updated packages...").start();
    const installCmd = getInstallCommand(pm);
    // --legacy-peer-deps is npm-specific
    const legacyPeerDepsFlag =
      options.legacyPeerDeps && pm === "npm" ? ["--legacy-peer-deps"] : [];
    const installArgs = [...installCmd, ...legacyPeerDepsFlag];

    execFileSync(pm, installArgs, {
      stdio: options.silent ? "ignore" : "inherit",
      allowNonInteractive,
    });

    console.log("\n");
    installSpinner.succeed(`Successfully upgraded packages using ${pm}\n`);
    return true;
  } catch (error) {
    spinner.fail(`Failed to upgrade packages: ${error}`);
    return false;
  }
}
