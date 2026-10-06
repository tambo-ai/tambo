/**
 * Shared with the `tambo` CLI: when set, the CLI skips printing its own copy
 * of the notice so users only see it once.
 */
export const SHUTDOWN_NOTICE_ENV_VAR = "TAMBO_SHUTDOWN_NOTICE_SHOWN";

/**
 * Prints the Tambo Cloud shutdown notice to stderr. Non-blocking.
 */
export function showShutdownNotice(): void {
  console.warn(
    [
      "",
      "⚠ Tambo Cloud is shutting down.",
      "  New signups are closed. Tambo Cloud keeps running until October 31, 2026;",
      "  after that the hosted API stops responding. User data is deleted November 30, 2026.",
      "  Announcement: https://tambo.co/blog/posts/tambo-is-shutting-down",
      "  Self-host Tambo instead: https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md",
      "",
    ].join("\n"),
  );
}
