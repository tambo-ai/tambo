import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import ora from "ora";

interface CreateAppOptions {
  legacyPeerDeps?: boolean;
}

function safeRemoveGitFolder(gitFolder: string): void {
  try {
    if (process.platform === 'win32') {
      // Windows: First remove read-only attributes, then remove directory
      try {
        execSync(`attrib -r "${gitFolder}\\*.*" /s`, { stdio: 'ignore' });
      } catch (_e) {
        console.error(chalk.red('Failed to remove read-only attributes'));
      }
      try {
        execSync(`rmdir /s /q "${gitFolder}"`, { stdio: 'ignore' });
      } catch (_e) {
        fs.rmSync(gitFolder, { recursive: true, force: true });
      }
    } else {
      // Unix-like systems (Mac, Linux)
      try {
        execSync(`rm -rf "${gitFolder}"`, { stdio: 'ignore' });
      } catch (_e) {
        fs.rmSync(gitFolder, { recursive: true, force: true });
      }
    }
  } catch (_error) {
    // If all removal attempts fail, warn but continue
    console.warn(chalk.yellow('\nWarning: Could not completely remove .git folder. You may want to remove it manually.'));
  }
}

export async function handleCreateApp(
  appName: string,
  options: CreateAppOptions = {}
): Promise<void> {
  // Validate app name
  if (appName !== "." && !/^[a-zA-Z0-9-_]+$/.test(appName)) {
    throw new Error("App name can only contain letters, numbers, dashes, and underscores");
  }

  const targetDir = appName === "." ? process.cwd() : path.join(process.cwd(), appName);
  
  console.log(chalk.blue(`\nCreating a new Tambo app in ${chalk.cyan(targetDir)}`));

  try {
    // Check if directory is empty when using "."
    if (appName === "." && fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      throw new Error("Current directory is not empty. Please use an empty directory or specify a new app name.");
    }

    // Create directory if it doesn't exist and appName is not "."
    if (appName !== ".") {
      if (fs.existsSync(targetDir)) {
        throw new Error(`Directory "${appName}" already exists. Please choose a different name or use an empty directory.`);
      }
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Clone the template repository
    const cloneSpinner = ora({
      text: 'Downloading template...',
      spinner: 'dots'
    }).start();
    
    try {
      execSync(
        `git clone --depth 1 https://github.com/tambo-ai/tambo-template.git ${
          appName === "." ? "." : appName
        }`,
        { stdio: 'ignore' }
      );
      cloneSpinner.succeed('Template downloaded successfully');
    } catch (_error) {
      cloneSpinner.fail('Failed to download template');
      throw new Error(
        "Failed to clone template repository. Please check your internet connection and try again."
      );
    }

    // Remove .git folder to start fresh
    const gitFolder = path.join(targetDir, ".git");
    if (fs.existsSync(gitFolder)) {
      safeRemoveGitFolder(gitFolder);
    }

    // Change to target directory
    process.chdir(targetDir);

    // Install dependencies with spinner
    const installSpinner = ora({
      text: 'Installing dependencies...',
      spinner: 'dots'
    }).start();
    
    try {
      execSync(
        `npm install${options.legacyPeerDeps ? " --legacy-peer-deps" : ""}`,
        { stdio: 'ignore' }
      );
      installSpinner.succeed('Dependencies installed successfully');
    } catch (_error) {
      installSpinner.fail('Failed to install dependencies');
      throw new Error(
        "Failed to install dependencies. Please try running 'npm install' manually."
      );
    }

    console.log(chalk.green("\nSuccessfully created a new Tambo app"));
    console.log("\nNext steps:");
    console.log(`  1. ${chalk.cyan(`cd ${appName === "." ? "." : appName}`)}`);
    console.log(`  2. ${chalk.cyan("npm run dev")}`);
    console.log(`  3. ${chalk.cyan("npx tambo init")} to complete setup`);
    console.log(`  4. ${chalk.cyan("npx tambo add <component-name>")} to add components`);
    console.log(`  5. ${chalk.cyan("npx tambo update <component-name>")} to update components`);

  } catch (error) {
    console.error(
      chalk.red("\nError creating app:"),
      error instanceof Error ? error.message : String(error)
    );
    // Clean up on failure if we created a new directory
    if (appName !== "." && fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (_e) {
        console.error(chalk.yellow(`\nFailed to clean up directory "${targetDir}". You may want to remove it manually.`));
      }
    }
    process.exit(1);
  }
} 