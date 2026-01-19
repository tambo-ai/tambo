/**
 * Error helpers for sanitizing error messages
 *
 * Provides utilities to extract safe error messages that don't leak
 * internal paths, stack traces, or system information.
 */

/**
 * Extracts a safe error message from an unknown error.
 * Redacts file paths and only returns the message portion of errors.
 *
 * @param error - The error to extract a message from
 * @returns A sanitized error message safe for user display
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Only return message, redact file paths
    const redactedUnix = error.message.replace(/\/[\w/.-]+\//g, "[path]/");
    return redactedUnix.replace(/[A-Za-z]:\\[^\s]+/g, (match) => {
      const lastSlashIndex = match.lastIndexOf("\\");
      if (lastSlashIndex === -1) {
        return "[path]/";
      }
      const tail = match.slice(lastSlashIndex + 1);
      return tail ? `[path]/${tail}` : "[path]/";
    });
  }
  return "An unexpected error occurred";
}
