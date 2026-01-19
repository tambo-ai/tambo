/**
 * full-send command - DEPRECATED alias for init
 *
 * This is a temporary alias that will be removed in a future version.
 * Please use 'tambov1 init' instead.
 */

import { defineCommand } from "citty";
import chalk from "chalk";

import { init } from "./init/index.js";

export const fullSend = defineCommand({
  meta: {
    name: "full-send",
    description: "[DEPRECATED] Use 'tambov1 init' instead",
  },
  args: init.args,
  subCommands: init.subCommands,
  async run(context) {
    // Show deprecation warning (unless in JSON mode)
    if (!context.args.json) {
      console.log(
        chalk.yellow("⚠️  DEPRECATED:") +
          " 'full-send' is deprecated. Please use 'tambov1 init' instead.\n"
      );
    }

    // Delegate to init command
    return init.run?.(context);
  },
});
