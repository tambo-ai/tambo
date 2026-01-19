#!/usr/bin/env node
/**
 * tambov1 - Non-Interactive CLI for Coding Agents
 *
 * Built with citty for elegant command handling.
 * All commands run without prompts and provide verbose output
 * with suggested next commands.
 */

import { defineCommand, runMain } from "citty";
import "dotenv/config";

// Handle Ctrl+C during prompts gracefully - exit silently without stack trace
// Check by error name since inquirer has nested @inquirer/core with different class instance
function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === "ExitPromptError";
}

process.on("uncaughtException", (error) => {
  if (isExitPromptError(error)) {
    process.exit(130); // Standard exit code for SIGINT
  }
  throw error;
});

process.on("unhandledRejection", (reason) => {
  if (isExitPromptError(reason)) {
    process.exit(130); // Standard exit code for SIGINT
  }
  throw reason;
});

import { fullSend } from "./commands/full-send.js";
import { init } from "./commands/init/index.js";
import { install } from "./commands/install.js";
import { components, list } from "./commands/components.js";
import { update } from "./commands/update.js";
import { upgrade } from "./commands/upgrade.js";
import { createApp } from "./commands/create-app.js";
import { migrate } from "./commands/migrate.js";
import { auth } from "./commands/auth.js";
import { project } from "./commands/project.js";
import { checkLatestVersion } from "./utils/version-check.js";

const main = defineCommand({
  meta: {
    name: "tambov1",
    version: "0.1.0",
    description: "Tambo CLI for generative UI",
  },
  args: {
    "no-interactive": {
      type: "boolean",
      default: false,
      description: "Disable interactive prompts even in TTY",
    },
  },
  subCommands: {
    "full-send": fullSend,
    init,
    install,
    add: install, // backward compat alias for 'tambo add'
    components,
    list, // backward compat alias for 'components installed'
    update,
    upgrade,
    "create-app": createApp,
    migrate,
    auth,
    project,
  },
});

// Fire-and-forget version check - don't block CLI startup
void checkLatestVersion();
void runMain(main);
