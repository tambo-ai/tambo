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
import { handleAuth, showAuthHelp } from "./commands/auth.js";
import { handleCreateApp } from "./commands/create-app.js";
import { handleInit } from "./commands/init.js";
import { handleListComponents } from "./commands/list/index.js";
import { handleMigrate } from "./commands/migrate.js";
import { handleUpdateComponents } from "./commands/update.js";
import { handleUpgrade } from "./commands/upgrade/index.js";
import { NonInteractiveError } from "./utils/interactive.js";

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
  prefix?: Flag<"string", string>;
  yes?: Flag<"boolean", boolean>;
  dryRun?: Flag<"boolean", boolean>;
  skipAgentDocs?: Flag<"boolean", boolean>;
  quiet?: Flag<"boolean", boolean>;
  force?: Flag<"boolean", boolean>;
  all?: Flag<"boolean", boolean>;
}

// Command help configuration (defined before CLI setup so we can generate help text)
interface CommandHelp {
  command: string;
  syntax: string;
  description: string;
  usage: string[];
  options: string[];
  examples: string[];
  exampleTitle?: string; // Shorter title for examples section, defaults to description
  note?: string; // Additional note to display in command list
  showComponents?: boolean;
  customSections?: () => void;
}

const OPTION_DOCS: Record<string, string> = {
  prefix: `${chalk.yellow("--prefix <path>")}      Custom directory for components (e.g., src/components/ui)`,
  yes: `${chalk.yellow("--yes, -y")}            Auto-answer yes to all prompts`,
  "skip-agent-docs": `${chalk.yellow("--skip-agent-docs")}     Skip creating/updating agent docs`,
  "legacy-peer-deps": `${chalk.yellow("--legacy-peer-deps")}   Use --legacy-peer-deps flag for npm install`,
  template: `${chalk.yellow("--template, -t <name>")}  Template to use: standard, analytics`,
  "init-git": `${chalk.yellow("--init-git")}           Initialize git repository automatically`,
  "dry-run": `${chalk.yellow("--dry-run")}            Preview changes without applying them`,
  quiet: `${chalk.yellow("--quiet, -q")}          Exit code 0 if authenticated, 1 otherwise`,
  force: `${chalk.yellow("--force, -f")}          Skip confirmation prompts`,
};

const COMMAND_HELP_CONFIGS: Record<string, CommandHelp> = {
  init: {
    command: "init",
    syntax: "init",
    description: "Initialize tambo in a project and set up configuration",
    usage: [
      `$ ${chalk.cyan("tambo init")} [options]`,
      `$ ${chalk.cyan("tambo full-send")} [options]  ${chalk.dim("(includes component installation)")}`,
    ],
    options: ["yes", "skip-agent-docs", "legacy-peer-deps"],
    examples: [
      `$ ${chalk.cyan("tambo init")}                      # Basic initialization`,
      `$ ${chalk.cyan("tambo init --yes")}                # Skip all prompts`,
      `$ ${chalk.cyan("tambo full-send")}                 # Full setup with components`,
    ],
    exampleTitle: "Getting Started",
  },
  "full-send": {
    command: "full-send",
    syntax: "full-send",
    description:
      "Full initialization with auth flow and component installation",
    usage: [`$ ${chalk.cyan("tambo full-send")} [options]`],
    options: ["yes", "skip-agent-docs", "legacy-peer-deps"],
    examples: [], // Shares examples with init
  },
  add: {
    command: "add",
    syntax: "add <components...>",
    description: "Add new components to your project",
    usage: [
      `$ ${chalk.cyan("tambo add")} <component> [component2] [...] [options]`,
    ],
    options: ["prefix", "yes", "skip-agent-docs", "legacy-peer-deps"],
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
    syntax: "list",
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
    syntax: "update <components...>",
    description: "Update specific tambo components from the registry",
    usage: [
      `$ ${chalk.cyan("tambo update")} <component> [component2] [...] [options]`,
      `$ ${chalk.cyan("tambo update installed")} [options]  ${chalk.dim("(updates ALL installed components)")}`,
    ],
    options: ["prefix", "yes", "legacy-peer-deps"],
    examples: [
      `$ ${chalk.cyan("tambo update message")}                   # Update single component`,
      `$ ${chalk.cyan("tambo update message form")}              # Update multiple components`,
      `$ ${chalk.cyan("tambo update installed")}                 # Update ALL installed components`,
      `$ ${chalk.cyan("tambo update message --prefix=src/ui")}   # Update in custom directory`,
    ],
    showComponents: true,
  },
  "update-installed": {
    command: "update-installed",
    syntax: "update installed",
    description: chalk.bold("Update ALL installed tambo components at once"),
    usage: [`$ ${chalk.cyan("tambo update installed")} [options]`],
    options: ["prefix", "yes", "legacy-peer-deps"],
    note: "This will update every tambo component currently in your project",
    examples: [], // Shares examples with update
  },
  upgrade: {
    command: "upgrade",
    syntax: "upgrade",
    description: "Upgrade packages, components, and LLM rules",
    usage: [`$ ${chalk.cyan("tambo upgrade")} [options]`],
    options: ["yes", "prefix", "skip-agent-docs", "legacy-peer-deps"],
    examples: [
      `$ ${chalk.cyan("tambo upgrade")}                                      # Interactive upgrade`,
      `$ ${chalk.cyan("tambo upgrade --yes --prefix src/components/ui")}     # Non-interactive (CI/CD)`,
      `$ ${chalk.cyan("tambo upgrade --yes --skip-agent-docs")}              # Auto-accept, skip docs`,
    ],
  },
  "create-app": {
    command: "create-app",
    syntax: "create-app [directory]",
    description: "Create a new tambo app from a template",
    usage: [`$ ${chalk.cyan("tambo create-app")} [directory] [options]`],
    options: ["template", "init-git", "legacy-peer-deps"],
    examples: [
      `$ ${chalk.cyan("tambo create-app")}                       # Interactive mode`,
      `$ ${chalk.cyan("tambo create-app my-app")}                # Create in 'my-app' directory`,
      `$ ${chalk.cyan("tambo create-app .")}                     # Create in current directory`,
      `$ ${chalk.cyan("tambo create-app --template=standard")}   # Use standard template`,
      `$ ${chalk.cyan("tambo create-app --init-git")}            # Initialize git repo`,
    ],
    exampleTitle: "Create Apps",
    customSections: () => {
      console.log(`
${chalk.bold("Templates")}
  ${chalk.cyan("standard")}    - Tambo + Tools + MCP (recommended)
  ${chalk.cyan("analytics")}   - Generative UI Analytics Template`);
    },
  },
  migrate: {
    command: "migrate",
    syntax: "migrate",
    description: "Migrate components from ui/ to tambo/ directory",
    usage: [`$ ${chalk.cyan("tambo migrate")} [options]`],
    options: ["yes", "dry-run"],
    examples: [
      `$ ${chalk.cyan("tambo migrate")}               # Interactive migration`,
      `$ ${chalk.cyan("tambo migrate --dry-run")}     # Preview changes only`,
    ],
  },
  auth: {
    command: "auth",
    syntax: "auth [subcommand]",
    description: "Manage authentication (status, login, logout, sessions)",
    usage: [
      `$ ${chalk.cyan("tambo auth")} [subcommand] [options]`,
      `$ ${chalk.cyan("tambo auth status")}         ${chalk.dim("Show authentication status")}`,
      `$ ${chalk.cyan("tambo auth login")}          ${chalk.dim("Authenticate via browser")}`,
      `$ ${chalk.cyan("tambo auth logout")}         ${chalk.dim("Clear stored credentials")}`,
      `$ ${chalk.cyan("tambo auth sessions")}       ${chalk.dim("List CLI sessions")}`,
      `$ ${chalk.cyan("tambo auth revoke-session")} ${chalk.dim("Revoke CLI session(s)")}`,
    ],
    options: ["quiet"],
    examples: [
      `$ ${chalk.cyan("tambo auth")}                # Show auth status`,
      `$ ${chalk.cyan("tambo auth status --quiet")} # Check auth in scripts (exit code)`,
    ],
    exampleTitle: "Authentication",
  },
  "auth-status": {
    command: "auth-status",
    syntax: "auth status",
    description: "Show current authentication status",
    usage: [`$ ${chalk.cyan("tambo auth status")} [options]`],
    options: ["quiet"],
    examples: [
      `$ ${chalk.cyan("tambo auth status")}         # Show auth status`,
      `$ ${chalk.cyan("tambo auth status --quiet")} # Exit 0 if authenticated, 1 otherwise`,
    ],
  },
  "auth-login": {
    command: "auth-login",
    syntax: "auth login",
    description: "Authenticate via browser",
    usage: [`$ ${chalk.cyan("tambo auth login")}`],
    options: [],
    examples: [
      `$ ${chalk.cyan("tambo auth login")} # Opens browser to authenticate`,
    ],
  },
  "auth-logout": {
    command: "auth-logout",
    syntax: "auth logout",
    description: "Clear stored credentials",
    usage: [`$ ${chalk.cyan("tambo auth logout")} [options]`],
    options: ["force"],
    examples: [
      `$ ${chalk.cyan("tambo auth logout")}         # Logout with confirmation`,
      `$ ${chalk.cyan("tambo auth logout --force")} # Logout without prompt`,
    ],
  },
  "auth-sessions": {
    command: "auth-sessions",
    syntax: "auth sessions",
    description: "List active CLI sessions",
    usage: [`$ ${chalk.cyan("tambo auth sessions")}`],
    options: [],
    examples: [
      `$ ${chalk.cyan("tambo auth sessions")} # List all CLI sessions`,
    ],
  },
  "auth-revoke-session": {
    command: "auth-revoke-session",
    syntax: "auth revoke-session [options]",
    description: "Revoke CLI session(s)",
    usage: [
      `$ ${chalk.cyan("tambo auth revoke-session")}       ${chalk.dim("Interactive session picker")}`,
      `$ ${chalk.cyan("tambo auth revoke-session --all")} ${chalk.dim("Revoke all sessions")}`,
    ],
    options: [],
    examples: [
      `$ ${chalk.cyan("tambo auth revoke-session")}       # Interactive session picker`,
      `$ ${chalk.cyan("tambo auth revoke-session --all")} # Revoke all sessions`,
    ],
  },
};

// Generate global help text from command configs
function generateGlobalHelp(): string {
  // Generate commands section - show all commands
  const commandsSection = Object.values(COMMAND_HELP_CONFIGS)
    .map((cmd) => {
      const opts = cmd.options;
      const optsList = opts.map((o) => `--${o}`).join(", ");

      let output = `    ${chalk.yellow(cmd.syntax)}${" ".repeat(Math.max(1, 30 - cmd.syntax.length))}${cmd.description}`;
      if (opts.length > 0) {
        output += `\n      Options: ${chalk.dim(optsList)}`;
      }
      if (cmd.note) {
        output += `\n      ${chalk.dim(cmd.note)}`;
      }
      return output;
    })
    .join("\n\n");

  // Generate option details section
  const optionDetails = [
    OPTION_DOCS.prefix,
    OPTION_DOCS.yes,
    OPTION_DOCS["skip-agent-docs"],
    OPTION_DOCS["legacy-peer-deps"],
    `${OPTION_DOCS.template} ${chalk.red("(create-app only)")}`,
    `${OPTION_DOCS["init-git"]} ${chalk.red("(create-app only)")}`,
    `${OPTION_DOCS["dry-run"]} ${chalk.red("(migrate only)")}`,
  ].join("\n    ");

  // Generate examples section - show each command's examples with its description as header
  const examplesSection = Object.values(COMMAND_HELP_CONFIGS)
    .filter((cmd) => cmd.examples.length > 0)
    .map((cmd) => {
      const title = cmd.exampleTitle ?? cmd.description;
      return `    ${chalk.dim(title)}\n    ${cmd.examples.join("\n    ")}`;
    })
    .join("\n\n");

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
    prefix: {
      type: "string",
      description: "Specify custom directory prefix for components",
    },
    yes: {
      type: "boolean",
      description: "Answer yes to all prompts automatically",
      shortFlag: "y",
    },
    skipAgentDocs: {
      type: "boolean",
      description: "Skip creating/updating agent docs",
    },
    dryRun: {
      type: "boolean",
      description: "Dry run migration without making changes",
    },
    quiet: {
      type: "boolean",
      description: "Quiet mode for auth status (exit code only)",
      shortFlag: "q",
    },
    force: {
      type: "boolean",
      description: "Force action without confirmation",
      shortFlag: "f",
    },
    all: {
      type: "boolean",
      description: "Revoke all CLI sessions",
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
      skipAgentDocs: Boolean(flags.skipAgentDocs),
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
      skipAgentDocs: Boolean(flags.skipAgentDocs),
    });
    return;
  }

  if (cmd === "list") {
    if (flags.help) {
      showListHelp();
      return;
    }
    await handleListComponents({
      prefix: flags.prefix as string | undefined,
      yes: Boolean(flags.yes ?? flags.y),
    });
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
      prefix: flags.prefix as string | undefined,
      yes: Boolean(flags.yes ?? flags.y),
      skipAgentDocs: Boolean(flags.skipAgentDocs),
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

  if (cmd === "auth") {
    if (flags.help) {
      showAuthHelp();
      return;
    }
    const subcommand = cli.input[1];
    await handleAuth(subcommand, {
      quiet: Boolean(flags.quiet ?? flags.q),
      force: Boolean(flags.force ?? flags.f),
      all: Boolean(flags.all),
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
    // NonInteractiveError already has a well-formatted message, don't add prefix
    if (error instanceof NonInteractiveError) {
      console.error(error.message);
    } else {
      console.error(
        chalk.red("Error executing command:"),
        error instanceof Error ? error.message : String(error),
      );
    }
    process.exit(1);
  }
}
void main();
