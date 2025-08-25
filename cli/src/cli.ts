#!/usr/bin/env node
import chalk from "chalk";
import Table from "cli-table3";
import "dotenv/config";
import { readFileSync } from "fs";
import meow, { type Flag, type Result } from "meow";
import { dirname, join } from "path";
import semver from "semver";
import { fileURLToPath } from "url";
import { handleAddComponents } from "./commands/add/index.js";
import { getComponentList } from "./commands/add/utils.js";
import { handleCreateApp } from "./commands/create-app.js";
import { handleInit } from "./commands/init.js";
import { handleListComponents } from "./commands/list/index.js";
import { handleMigrate } from "./commands/migrate.js";
import { handleUpdateComponents } from "./commands/update.js";
import { handleUpgrade } from "./commands/upgrade/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get current version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);
const currentVersion = packageJson.version;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CLIFlags extends Record<string, any> {
  init?: Flag<"boolean", boolean>;
  legacyPeerDeps?: Flag<"boolean", boolean>;
  initGit?: Flag<"boolean", boolean>;
  version?: Flag<"boolean", boolean>;
  template?: Flag<"string", string>;
  acceptAll?: Flag<"boolean", boolean>;
  prefix?: Flag<"string", string>;
  yes?: Flag<"boolean", boolean>;
  dryRun?: Flag<"boolean", boolean>;
}

// CLI setup
const cli = meow(
  `
  ${chalk.bold("Usage")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("<command>")} [options]

  ${chalk.bold("Commands")}

    ${chalk.yellow("init")}                 Initialize tambo in a project and set up configuration
      Options: ${chalk.dim("--yes, --legacy-peer-deps")}

    ${chalk.yellow("full-send")}            Full initialization with auth flow and component installation
      Options: ${chalk.dim("--yes, --legacy-peer-deps")}

    ${chalk.yellow("add <components...>")}   Add new components to your project
      Options: ${chalk.dim("--prefix, --yes, --legacy-peer-deps")}

    ${chalk.yellow("list")}                 List all installed components
      Options: ${chalk.dim("--prefix")}

    ${chalk.yellow("update <components...>")} Update specific tambo components from the registry
      Options: ${chalk.dim("--prefix, --yes, --legacy-peer-deps")}

    ${chalk.yellow("update installed")}     ${chalk.bold("Update ALL installed tambo components at once")}
      Options: ${chalk.dim("--prefix, --yes, --legacy-peer-deps")}
      ${chalk.dim("This will update every tambo component currently in your project")}

    ${chalk.yellow("upgrade")}              Upgrade packages, components, and LLM rules
      Options: ${chalk.dim("--prefix, --accept-all, --legacy-peer-deps")}

    ${chalk.yellow("create-app [directory]")} Create a new tambo app from a template
      Options: ${chalk.dim("--template, --init-git, --legacy-peer-deps")}

    ${chalk.yellow("migrate")}              Migrate components from ui/ to tambo/ directory
      Options: ${chalk.dim("--yes, --dry-run")}

  ${chalk.bold("Global Options")}
    ${chalk.yellow("--version")}            Show version number

  ${chalk.bold("Option Details")}
    ${chalk.yellow("--prefix <path>")}      Custom directory for components (e.g., src/components/ui)
    ${chalk.yellow("--yes, -y")}            Auto-answer yes to all prompts
    ${chalk.yellow("--legacy-peer-deps")}   Use --legacy-peer-deps flag for npm install
    ${chalk.yellow("--accept-all")}         Accept all upgrades without prompting ${chalk.red("(upgrade only)")}
    ${chalk.yellow("--template, -t <name>")} Template to use: standard ${chalk.red("(create-app only)")}
    ${chalk.yellow("--init-git")}           Initialize git repository ${chalk.red("(create-app only)")}
    ${chalk.yellow("--dry-run")}            Preview changes without applying ${chalk.red("(migrate only)")}

  ${chalk.bold("Examples")}

    ${chalk.dim("Getting Started")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("init")}                           # Initialize tambo
    $ ${chalk.cyan("tambo")} ${chalk.yellow("init --yes")}                     # Skip prompts
    $ ${chalk.cyan("tambo")} ${chalk.yellow("full-send")}                      # Full setup with components

    ${chalk.dim("Adding Components")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message")}                    # Add single component
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message form graph")}         # Add multiple components
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message --yes")}              # Skip prompts
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message --prefix=src/ui")}    # Custom directory

    ${chalk.dim("Managing Components")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("list")}                           # List all components
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update message")}                 # Update specific component
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update message form")}            # Update multiple components
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update message --prefix=src/ui")} # Update in custom directory
    
    ${chalk.dim("Update All Components")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update installed")}               # ${chalk.bold("Update ALL installed tambo components")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update installed --yes")}         # Skip confirmation prompts
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update installed --prefix=src/ui")} # Update all in custom directory

    ${chalk.dim("Creating New Apps")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app")}                     # Create in new directory
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app .")}                   # Create in current directory
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app --template=standard")} # Use standard template
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app --init-git")}          # Initialize git repo

    ${chalk.dim("Upgrading & Migration")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("upgrade")}                        # Interactive upgrade
    $ ${chalk.cyan("tambo")} ${chalk.yellow("upgrade --accept-all")}           # Auto-accept all changes
    $ ${chalk.cyan("tambo")} ${chalk.yellow("migrate --dry-run")}              # Preview migration
    $ ${chalk.cyan("tambo")} ${chalk.yellow("migrate --yes")}                  # Migrate ui/ to tambo/

    ${chalk.dim("Troubleshooting")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message --legacy-peer-deps")} # Fix dependency conflicts
    $ ${chalk.cyan("tambo")} ${chalk.yellow("--version")}                      # Check version
  `,
  {
    flags: {
      init: {
        type: "boolean",
        description: "Initialize tambo in a project",
      },
      legacyPeerDeps: {
        type: "boolean",
        description: "Install dependencies with --legacy-peer-deps flag",
      },
      initGit: {
        type: "boolean",
        description: "Initialize a new git repository after creating the app",
      },
      template: {
        type: "string",
        description: "Specify template to use (standard)",
        shortFlag: "t",
      },
      acceptAll: {
        type: "boolean",
        description: "Accept all upgrades without prompting",
      },
      prefix: {
        type: "string",
        description: "Specify custom directory prefix for components",
      },
      yes: {
        type: "boolean",
        description: "Answer yes to all prompts automatically",
        shortFlag: "y",
      },
      dryRun: {
        type: "boolean",
        description: "Dry run migration without making changes",
      },
    },
    importMeta: import.meta,
  },
);

// Check for latest version
async function checkLatestVersion() {
  try {
    const response = await fetch("https://registry.npmjs.org/tambo/latest");
    const data = await response.json();
    const latestVersion = data.version;

    if (!semver.gte(currentVersion, latestVersion)) {
      console.log(
        chalk.yellow(
          `\nA new version of tambo is available! (${latestVersion} > ${currentVersion})`,
        ),
      );
      console.log(
        chalk.blue(`To upgrade, run: ${chalk.cyan("npx tambo@latest")}\n`),
      );
    }
  } catch (_error) {
    // Silently fail version check
  }
}

// Command handlers
async function handleCommand(cmd: string, flags: Result<CLIFlags>["flags"]) {
  if (flags.version) {
    console.log(currentVersion);
    return;
  }

  if (cmd === "help" || !cmd) {
    console.log(cli.help);
    return;
  }

  if (cmd === "init" || cmd === "full-send") {
    await handleInit({
      fullSend: cmd === "full-send",
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      yes: Boolean(flags.yes),
    });
    return;
  }

  if (cmd === "add") {
    const componentNames = cli.input.slice(1);
    if (componentNames.length === 0) {
      console.error(chalk.red("Component names are required"));

      showComponentList();
      console.log(
        `Run ${chalk.cyan("npx tambo add <componentName> [componentName2] [...]")} to add components\n`,
      );
      console.log(
        `See demos of all components at ${chalk.cyan("https://ui.tambo.co")}\n`,
      );
      return;
    }
    await handleAddComponents(componentNames, {
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      installPath: flags.prefix as string | undefined,
      isExplicitPrefix: Boolean(flags.prefix),
      yes: Boolean(flags.yes),
    });
    return;
  }

  if (cmd === "list") {
    await handleListComponents(flags.prefix as string | undefined);
    return;
  }

  if (cmd === "update") {
    const componentNames = cli.input.slice(1);
    if (componentNames.length === 0) {
      console.error(chalk.red("Component names are required"));

      showComponentList();
      console.log(
        `Run ${chalk.cyan(
          "npx tambo update <componentName> [componentName2] [...]",
        )} to update components or ${chalk.cyan(
          "npx tambo update installed",
        )} to update all installed components\n`,
      );
      console.log(
        `See demos of all components at ${chalk.cyan("https://ui.tambo.co")}\n`,
      );
      return;
    }
    await handleUpdateComponents(componentNames, {
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      prefix: flags.prefix as string | undefined,
      yes: Boolean(flags.yes),
    });
    return;
  }

  if (cmd === "create-app") {
    let helpText = "";

    if (!flags.initGit) {
      helpText += `\nAdd ${chalk.yellow(
        "--init-git",
      )} flag to initialize a git repository automatically`;
    }

    if (!flags.template) {
      helpText += `\nAdd ${chalk.yellow("--template <name>")} or ${chalk.yellow(
        "-t <name>",
      )} to specify a template (standard)`;
    }

    if (helpText) {
      console.log(helpText);
    }
    await handleCreateApp({
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      initGit: Boolean(flags.initGit),
      template: flags.template as string | undefined,
      name: cli.input[1],
    });
    return;
  }

  if (cmd === "upgrade") {
    await handleUpgrade({
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      acceptAll: Boolean(flags.acceptAll),
      prefix: flags.prefix as string | undefined,
    });
    return;
  }

  if (cmd === "migrate") {
    await handleMigrate({
      yes: Boolean(flags.yes),
      dryRun: Boolean(flags.dryRun),
    });
    return;
  }

  // If no command is provided, show help
  console.log(`Unrecognized command: ${chalk.red(cmd)}`);
  console.log(cli.help);
}

function showComponentList() {
  const components = getComponentList();
  components.sort((a, b) => a.name.localeCompare(b.name));
  console.log(chalk.bold("Available components:"));

  const table = new Table({
    head: ["Component", "Description"],
    colWidths: [
      Math.max(...getComponentList().map((c) => c.name.length)) + 2,
      process.stdout.columns -
        (Math.max(...getComponentList().map((c) => c.name.length)) + 5),
    ],
    wordWrap: true,
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: "│",
    },
    style: {
      head: ["cyan"],
      border: ["gray"],
    },
  });

  components.forEach((component) => {
    table.push([component.name, component.description]);
  });

  console.log(table.toString());
  console.log("\n");
}

// Main execution
async function main() {
  try {
    const command = cli.input[0];
    const flags = cli.flags;
    // Check for latest version before executing command
    await checkLatestVersion();

    await handleCommand(command, flags);
  } catch (error) {
    console.error(
      chalk.red("Error executing command:"),
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}
main();
