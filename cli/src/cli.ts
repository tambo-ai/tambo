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
}

// CLI setup
const cli = meow(
  `
  ${chalk.bold("Usage")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("<command>")} [options]

  ${chalk.bold("Commands")}
    ${chalk.yellow(
      "init",
    )}                Initialize tambo in a project and set up configuration
    ${chalk.yellow("add")}                 Add new components
    ${chalk.yellow("list")}                List all installed components
    ${chalk.yellow(
      "update",
    )}              Update existing components from the registry
    ${chalk.yellow(
      "upgrade",
    )}             Upgrade packages, components, and LLM rules
    ${chalk.yellow(
      "full-send",
    )}           Full initialization with auth flow and component installation
    ${chalk.yellow(
      "create-app",
    )}          Create a new tambo app from a template

  ${chalk.bold("Options")}
    ${chalk.yellow(
      "--legacy-peer-deps",
    )}  Install dependencies with --legacy-peer-deps flag
    ${chalk.yellow(
      "--init-git",
    )}          Initialize a new git repository after creating the app
    ${chalk.yellow("--template, -t <name>")}   Specify template to use (-t mcp)
    ${chalk.yellow("--accept-all")}        Accept all upgrades without prompting, use with caution, only works with upgrade command
    ${chalk.yellow("--prefix <path>")}     Specify custom directory prefix for components (e.g., src/components/ui/tambo)
    ${chalk.yellow("--yes, -y")}           Answer yes to all prompts automatically
    ${chalk.yellow("--version")}           Show version number

  ${chalk.bold("Examples")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("init")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("full-send")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add <componentName>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add <component1> <component2> <component3>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("list")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update <componentName>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update <component1> <component2> <component3>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update installed")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("upgrade")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("upgrade --accept-all")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow(
      "add <componentName> --legacy-peer-deps",
    )}
    $ ${chalk.cyan("tambo")} ${chalk.yellow(
      "update <componentName> --legacy-peer-deps",
    )}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app --init-git")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app --template mcp")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app -t mcp")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("create-app . --init-git")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("--prefix=src/components/ui/tambo update message")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("--prefix=components/ui/third-party add message")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message -y")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update installed --yes")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("init -y")}
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
        description:
          "Specify template to use (mcp, standard, conversational-form)",
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
        `Run ${chalk.cyan("tambo add <componentName> [componentName2] [...]")} to add components`,
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
          "tambo update <componentName> [componentName2] [...]",
        )} to update components or ${chalk.cyan("tambo update installed")} to update all installed components`,
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
      )} to specify a template (mcp, standard, conversational-form)`;
    }

    if (helpText) {
      console.log(helpText);
    }
    await handleCreateApp({
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      initGit: Boolean(flags.initGit),
      template: flags.template as string | undefined,
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
