/**
 * Check if running in an interactive TTY context.
 * Returns true when human interaction is possible.
 *
 * Checks:
 * - process.stdout.isTTY (terminal attached)
 * - CI environment variable (CI/CD systems)
 * - GITHUB_ACTIONS environment variable
 * - TERM === "dumb" (dumb terminals)
 * - FORCE_INTERACTIVE override for testing
 */
export function isTTY({
  stream = process.stdout,
}: { stream?: NodeJS.WriteStream } = {}): boolean {
  // Check for TTY
  if (!stream?.isTTY) {
    return false;
  }

  // Check for dumb terminal
  if (process.env.TERM === "dumb") {
    return false;
  }

  // Allow forcing interactive mode for testing
  if (process.env.FORCE_INTERACTIVE === "1") {
    return true;
  }

  // Check for CI environments
  const ciEnv = process.env.CI;
  if (typeof ciEnv === "string" && ciEnv.trim() !== "" && ciEnv !== "0") {
    return false;
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    return false;
  }

  return true;
}
