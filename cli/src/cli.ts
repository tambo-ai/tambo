#!/usr/bin/env node
import chalk from "chalk";
import "dotenv/config";
import meow, { type Flag, type Result } from "meow";
import { handleAddComponent } from "./commands/add/index.js";
import { handleInit } from "./commands/init.js";
import { handleUpdateComponent } from "./commands/update.js";

interface CLIFlags extends Record<string, any> {
  init?: Flag<"boolean", boolean>;
  legacyPeerDeps?: Flag<"boolean", boolean>;
}

// CLI setup
const cli = meow(
  `
  ${chalk.bold("Usage")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("<command>")} [options]

  ${chalk.bold("Commands")}
    ${chalk.yellow("init")}                Initialize tambo in a project and set up configuration
    ${chalk.yellow("add")}                 Add a new component
    ${chalk.yellow("update")}              Update an existing component from the registry
    ${chalk.yellow("full-send")}           Full initialization with auth flow and component installation

  ${chalk.bold("Options")}
    ${chalk.yellow("--legacy-peer-deps")}  Install dependencies with --legacy-peer-deps flag

  ${chalk.bold("Examples")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("init")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("full-send")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add <componentName>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update <componentName>")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add <componentName> --legacy-peer-deps")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("update <componentName> --legacy-peer-deps")}
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
    },
    importMeta: import.meta,
  },
);

// Command handlers
async function handleCommand(cmd: string, flags: Result<CLIFlags>["flags"]) {
  if (cmd === "help" || !cmd) {
    console.log(cli.help);
    return;
  }

  if (cmd === "init" || cmd === "full-send") {
    await handleInit({
      fullSend: cmd === "full-send",
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
    });
    return;
  }

  if (cmd === "add") {
    const componentName = cli.input[1];
    if (!componentName) {
      console.error(chalk.red("Component name is required"));
      console.log(
        `Run ${chalk.cyan("tambo add <componentName>")} to add a new component`,
      );
      return;
    }
    await handleAddComponent(componentName, {
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
    });
    return;
  }

  if (cmd === "update") {
    const componentName = cli.input[1];
    if (!componentName) {
      console.error(chalk.red("Component name is required"));
      console.log(
        `Run ${chalk.cyan("tambo update <componentName>")} to update a component`,
      );
      return;
    }
    await handleUpdateComponent(componentName, {
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
    });
    return;
  }
}

// Main execution
async function main() {
  try {
    const command = cli.input[0];
    const flags = cli.flags;
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
