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
  help?: Flag<"boolean", boolean>;
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

// Command help configuration (defined before CLI setup so we can generate help text)
interface CommandHelp {
  command: string;
  description: string;
  usage: string[];
  options: string[];
  examples: string[];
  showComponents?: boolean;
  customSections?: () => void;
}

const OPTION_DOCS: Record<string, string> = {
  prefix: `${chalk.yellow("--prefix <path>")}      Custom directory for components (e.g., src/components/ui)`,
  yes: `${chalk.yellow("--yes, -y")}            Auto-answer yes to all prompts`,
  legacyPeerDeps: `${chalk.yellow("--legacy-peer-deps")}   Use --legacy-peer-deps flag for npm install`,
  acceptAll: `${chalk.yellow("--accept-all")}         Accept all upgrades without prompting`,
  template: `${chalk.yellow("--template, -t <name>")}  Template to use: standard, analytics`,
  initGit: `${chalk.yellow("--init-git")}           Initialize git repository automatically`,
  dryRun: `${chalk.yellow("--dry-run")}            Preview changes without applying them`,
};

const COMMAND_HELP_CONFIGS: Record<string, CommandHelp> = {
  init: {
    command: "init",
    description: "Initialize tambo in your project",
    usage: [
      `$ ${chalk.cyan("tambo init")} [options]`,
      `$ ${chalk.cyan("tambo full-send")} [options]  ${chalk.dim("(includes component installation)")}`,
    ],
    options: ["yes", "legacyPeerDeps"],
    examples: [
      `$ ${chalk.cyan("tambo init")}                      # Basic initialization`,
      `$ ${chalk.cyan("tambo init --yes")}                # Skip all prompts`,
      `$ ${chalk.cyan("tambo full-send")}                 # Full setup with components`,
    ],
  },
  add: {
    command: "add",
    description: "Add components to your project",
    usage: [
      `$ ${chalk.cyan("tambo add")} <component> [component2] [...] [options]`,
    ],
    options: ["prefix", "yes", "legacyPeerDeps"],
    examples: [
      `$ ${chalk.cyan("tambo add message")}                    # Add single component`,
      `$ ${chalk.cyan("tambo add message form graph")}         # Add multiple components`,
      `$ ${chalk.cyan("tambo add message --yes")}              # Skip prompts`,
      `$ ${chalk.cyan("tambo add message --prefix=src/ui")}    # Custom directory`,
    ],
    showComponents: true,
  },
  list: {
    command: "list",
    description: "List all installed components",
    usage: [`$ ${chalk.cyan("tambo list")} [options]`],
    options: ["prefix"],
    examples: [
      `$ ${chalk.cyan("tambo list")}                    # List components`,
      `$ ${chalk.cyan("tambo list --prefix=src/ui")}    # List in custom directory`,
    ],
  },
  update: {
    command: "update",
    description: "Update tambo components from the registry",
    usage: [
      `$ ${chalk.cyan("tambo update")} <component> [component2] [...] [options]`,
      `$ ${chalk.cyan("tambo update installed")} [options]  ${chalk.dim("(updates ALL installed components)")}`,
    ],
    options: ["prefix", "yes", "legacyPeerDeps"],
    examples: [
      `$ ${chalk.cyan("tambo update message")}                   # Update single component`,
      `$ ${chalk.cyan("tambo update message form")}              # Update multiple components`,
      `$ ${chalk.cyan("tambo update installed")}                 # Update ALL installed components`,
      `$ ${chalk.cyan("tambo update message --prefix=src/ui")}   # Update in custom directory`,
    ],
    showComponents: true,
  },
  "create-app": {
    command: "create-app",
    description: "Create a new tambo app from a template",
    usage: [`$ ${chalk.cyan("tambo create-app")} [directory] [options]`],
    options: ["template", "initGit", "legacyPeerDeps"],
    examples: [
      `$ ${chalk.cyan("tambo create-app")}                       # Interactive mode`,
      `$ ${chalk.cyan("tambo create-app my-app")}                # Create in 'my-app' directory`,
      `$ ${chalk.cyan("tambo create-app .")}                     # Create in current directory`,
      `$ ${chalk.cyan("tambo create-app --template=standard")}   # Use standard template`,
      `$ ${chalk.cyan("tambo create-app --init-git")}            # Initialize git repo`,
    ],
    customSections: () => {
      console.log(`
${chalk.bold("Templates")}
  ${chalk.cyan("standard")}    - Tambo + Tools + MCP (recommended)
  ${chalk.cyan("analytics")}   - Generative UI Analytics Template`);
    },
  },
  upgrade: {
    command: "upgrade",
    description: "Upgrade packages, components, and LLM rules",
    usage: [`$ ${chalk.cyan("tambo upgrade")} [options]`],
    options: ["prefix", "acceptAll", "legacyPeerDeps"],
    examples: [
      `$ ${chalk.cyan("tambo upgrade")}                    # Interactive upgrade`,
      `$ ${chalk.cyan("tambo upgrade --accept-all")}       # Auto-accept all changes`,
    ],
  },
  migrate: {
    command: "migrate",
    description: "Migrate components from ui/ to tambo/ directory",
    usage: [`$ ${chalk.cyan("tambo migrate")} [options]`],
    options: ["yes", "dryRun"],
    examples: [
      `$ ${chalk.cyan("tambo migrate")}               # Interactive migration`,
      `$ ${chalk.cyan("tambo migrate --dry-run")}     # Preview changes only`,
    ],
  },
};

// Example grouping configuration
const EXAMPLE_GROUPS = [
  {
    title: "Getting Started",
    commands: ["init"],
  },
  {
    title: "Adding Components",
    commands: ["add"],
  },
  {
    title: "Managing Components",
    commands: ["list", "update"],
  },
  {
    title: "Creating New Apps",
    commands: ["create-app"],
  },
  {
    title: "Upgrading & Migration",
    commands: ["upgrade", "migrate"],
  },
];

// Command list with special formatting
const COMMAND_LIST = [
  {
    key: "init",
    syntax: "init",
    description: "Initialize tambo in a project and set up configuration",
  },
  {
    key: "full-send",
    syntax: "full-send",
    description:
      "Full initialization with auth flow and component installation",
    options: ["yes", "legacyPeerDeps"],
  },
  {
    key: "add",
    syntax: "add <components...>",
    description: "Add new components to your project",
  },
  { key: "list", syntax: "list", description: "List all installed components" },
  {
    key: "update",
    syntax: "update <components...>",
    description: "Update specific tambo components from the registry",
  },
  {
    key: "update-installed",
    syntax: "update installed",
    description: `${chalk.bold("Update ALL installed tambo components at once")}`,
    options: ["prefix", "yes", "legacyPeerDeps"],
    note: "This will update every tambo component currently in your project",
  },
  {
    key: "upgrade",
    syntax: "upgrade",
    description: "Upgrade packages, components, and LLM rules",
  },
  {
    key: "create-app",
    syntax: "create-app [directory]",
    description: "Create a new tambo app from a template",
  },
  {
    key: "migrate",
    syntax: "migrate",
    description: "Migrate components from ui/ to tambo/ directory",
  },
];

// Generate global help text from command configs
function generateGlobalHelp(): string {
  // Generate commands section
  const commandsSection = COMMAND_LIST.map((cmd) => {
    const config =
      COMMAND_HELP_CONFIGS[cmd.key] ??
      COMMAND_HELP_CONFIGS[cmd.key.split("-")[0]];
    const opts = cmd.options ?? config?.options ?? [];
    const optsList = opts
      .map((o) => `--${o.replace(/([A-Z])/g, "-$1").toLowerCase()}`)
      .join(", ");

    let output = `    ${chalk.yellow(cmd.syntax)}${" ".repeat(Math.max(1, 30 - cmd.syntax.length))}${cmd.description}`;
    if (opts.length > 0) {
      output += `\n      Options: ${chalk.dim(optsList)}`;
    }
    if (cmd.note) {
      output += `\n      ${chalk.dim(cmd.note)}`;
    }
    return output;
  }).join("\n\n");

  // Generate option details section
  const optionDetails = [
    OPTION_DOCS.prefix,
    OPTION_DOCS.yes,
    OPTION_DOCS.legacyPeerDeps,
    `${OPTION_DOCS.acceptAll} ${chalk.red("(upgrade only)")}`,
    `${OPTION_DOCS.template} ${chalk.red("(create-app only)")}`,
    `${OPTION_DOCS.initGit} ${chalk.red("(create-app only)")}`,
    `${OPTION_DOCS.dryRun} ${chalk.red("(migrate only)")}`,
  ].join("\n    ");

  // Generate examples section
  const examplesSection = EXAMPLE_GROUPS.map((group) => {
    const examples = group.commands
      .map((cmd) => COMMAND_HELP_CONFIGS[cmd]?.examples.join("\n    "))
      .filter(Boolean)
      .join("\n    ");
    return `    ${chalk.dim(group.title)}\n    ${examples}`;
  }).join("\n\n");

  return `
  ${chalk.bold("Usage")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("<command>")} [options]

  ${chalk.bold("Commands")}

${commandsSection}

  ${chalk.bold("Global Options")}
    ${chalk.yellow("--version")}            Show version number
    ${chalk.yellow("--help, -h")}           Show help information

  ${chalk.bold("Option Details")}
    ${optionDetails}

  ${chalk.bold("Examples")}

${examplesSection}

    ${chalk.dim("Troubleshooting")}
    $ ${chalk.cyan("tambo")} ${chalk.yellow("add message --legacy-peer-deps")} # Fix dependency conflicts
    $ ${chalk.cyan("tambo")} ${chalk.yellow("--version")}                      # Check version
  `;
}

// CLI setup
const cli = meow(generateGlobalHelp(), {
  flags: {
    help: {
      type: "boolean",
      description: "Show help information",
      shortFlag: "h",
    },
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
      description: "Specify template to use (standard, analytics)",
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
});

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
    if (flags.help) {
      showInitHelp();
      return;
    }
    await handleInit({
      fullSend: cmd === "full-send",
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      yes: Boolean(flags.yes),
    });
    return;
  }

  if (cmd === "add") {
    if (flags.help) {
      showAddHelp();
      return;
    }
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
    if (flags.help) {
      showListHelp();
      return;
    }
    await handleListComponents(flags.prefix as string | undefined);
    return;
  }

  if (cmd === "update") {
    if (flags.help) {
      showUpdateHelp();
      return;
    }
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
    if (flags.help) {
      showCreateAppHelp();
      return;
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
    if (flags.help) {
      showUpgradeHelp();
      return;
    }
    await handleUpgrade({
      legacyPeerDeps: Boolean(flags.legacyPeerDeps),
      acceptAll: Boolean(flags.acceptAll),
      prefix: flags.prefix as string | undefined,
    });
    return;
  }

  if (cmd === "migrate") {
    if (flags.help) {
      showMigrateHelp();
      return;
    }
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

// Generic command help formatter
function showCommandHelp(config: CommandHelp) {
  console.log(`
${chalk.bold(`tambo ${config.command}`)} - ${config.description}

${chalk.bold("Usage")}`);
  config.usage.forEach((line) => console.log(`  ${line}`));

  console.log(`
${chalk.bold("Options")}`);
  config.options.forEach((opt) => console.log(`  ${OPTION_DOCS[opt]}`));

  console.log(`
${chalk.bold("Examples")}`);
  config.examples.forEach((example) => console.log(`  ${example}`));

  if (config.customSections) {
    config.customSections();
  }

  if (config.showComponents) {
    console.log(`
${chalk.bold("Available Components")}`);
    showComponentList();
    console.log(`See demos at ${chalk.cyan("https://ui.tambo.co")}`);
  }

  console.log();
}

// Command-specific help functions use shared configs
function showInitHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.init);
}

function showAddHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.add);
}

function showListHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.list);
}

function showUpdateHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.update);
}

function showCreateAppHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS["create-app"]);
}

function showUpgradeHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.upgrade);
}

function showMigrateHelp() {
  showCommandHelp(COMMAND_HELP_CONFIGS.migrate);
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
