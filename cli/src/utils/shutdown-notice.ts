import chalk from "chalk";

/**
 * Set once the shutdown notice has been printed, so nested invocations
 * (create-tambo-app -> tambo create-app -> tambo init) only show it once.
 */
export const SHUTDOWN_NOTICE_ENV_VAR = "TAMBO_SHUTDOWN_NOTICE_SHOWN";

export const SHUTDOWN_ANNOUNCEMENT_URL =
  "https://tambo.co/blog/posts/tambo-is-shutting-down";

export const SELF_HOSTING_URL =
  "https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md";

/**
 * Builds the Tambo Cloud shutdown notice text.
 * @returns The multi-line notice, without color codes.
 */
export function formatShutdownNotice(): string {
  return [
    "⚠ Tambo Cloud is shutting down.",
    "  New signups are closed. Tambo Cloud keeps running until October 31, 2026;",
    "  after that the hosted API stops responding. User data is deleted November 30, 2026.",
    `  Announcement: ${SHUTDOWN_ANNOUNCEMENT_URL}`,
    `  Self-host Tambo instead: ${SELF_HOSTING_URL}`,
  ].join("\n");
}

/**
 * Prints the Tambo Cloud shutdown notice to stderr (non-blocking), at most once
 * per process tree. Marks the notice as shown in `process.env` so child
 * processes spawned with the inherited environment skip it.
 */
export function showShutdownNotice(): void {
  if (process.env[SHUTDOWN_NOTICE_ENV_VAR]) return;
  console.warn(chalk.yellow(`\n${formatShutdownNotice()}\n`));
  process.env[SHUTDOWN_NOTICE_ENV_VAR] = "1";
}
