/**
 * Extract a human-readable message from a tRPC/zod error.
 * tRPC wraps zod validation errors as a JSON-stringified array of issues;
 * this parses the first message out. Falls back to the raw string if
 * parsing fails.
 * @returns A single error message string.
 */
export function extractErrorMessage(error: { message: string }): string {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first: unknown = parsed[0];
      if (
        first !== null &&
        typeof first === "object" &&
        "message" in first &&
        typeof (first as Record<string, unknown>).message === "string"
      ) {
        return (first as Record<string, unknown>).message as string;
      }
    }
  } catch {
    // Not JSON -- use as-is
  }
  return error.message;
}
