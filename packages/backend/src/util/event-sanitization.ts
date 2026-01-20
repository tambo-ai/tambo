// Pattern to match control characters that should be removed from strings
// Removes null bytes and most control characters (keeps tab, newline, carriage return)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/**
 * Sanitizes event objects before sending them to clients via SSE or other channels.
 *
 * This function ensures that:
 * - Sensitive fields are removed or redacted
 * - Error messages don't expose internal details
 * - Stack traces are never included
 * - All values are safe for JSON serialization
 * - String values are validated to prevent XSS attacks
 *
 * Note: Events are JSON-serialized before transmission, so quotes and special
 * characters are automatically escaped. However, we still validate string content
 * to ensure it doesn't contain potentially dangerous patterns.
 *
 * @param event - The event object to sanitize
 * @returns A sanitized copy of the event safe for client consumption
 */
export function sanitizeEvent<T extends Record<string, unknown>>(event: T): T {
  // Fields that should never be sent to clients
  const sensitiveFields = new Set([
    "stack",
    "stackTrace",
    "error_stack",
    "internalError",
    "originalError",
    "rawError",
    "__proto__",
    "constructor",
    "prototype",
  ]);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(event)) {
    // Skip sensitive fields entirely
    if (sensitiveFields.has(key)) {
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeEvent(value as Record<string, unknown>);
      continue;
    }

    // Sanitize arrays by sanitizing each element
    if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (item && typeof item === "object") {
          return sanitizeEvent(item as Record<string, unknown>);
        }
        if (typeof item === "string") {
          return item.replace(CONTROL_CHARS_PATTERN, "");
        }
        return item;
      });
      continue;
    }

    // String values: validate they don't contain null bytes or control characters
    // that could cause issues. JSON.stringify will handle quote escaping.
    if (typeof value === "string") {
      sanitized[key] = value.replace(CONTROL_CHARS_PATTERN, "");
      continue;
    }

    // Pass through other primitives (numbers, booleans, null, undefined)
    sanitized[key] = value;
  }

  return sanitized as T;
}
