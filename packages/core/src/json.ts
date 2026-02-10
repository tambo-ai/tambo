/** Parse a JSON string, but don't throw an error if it's not valid JSON */
export function tryParseJson(
  text: string,
): Array<unknown> | Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

/** Parse a JSON string, optionally throwing an error if it is definitively not a JSON object */
export function tryParseJsonObject(
  text: string,
  shouldThrow: boolean = false,
): Record<string, unknown> | null {
  if (text && !text.startsWith("{")) {
    if (shouldThrow) {
      throw new Error("Not a JSON object");
    }
    return null;
  }
  return tryParseJson(text) as Record<string, unknown> | null;
}

/** Parse a JSON string, optionally throwing an error if it is definitively not a JSON array */
export function tryParseJsonArray(
  text: string,
  shouldThrow: boolean = false,
): Array<unknown> | null {
  if (text && !text.startsWith("[")) {
    if (shouldThrow) {
      throw new Error("Not a JSON array");
    }
    return null;
  }
  return tryParseJson(text) as Array<unknown> | null;
}

/**
 * Stringify a value as JSON, but escape characters that can break out of
 * markup-like wrappers (e.g., when embedding JSON inside an XML/HTML tag).
 *
 * This keeps the output valid JSON while preventing `<`, `>`, and `&` from
 * appearing literally.
 *
 * Throws if the value is not JSON-serializable (for example, circular
 * references).
 *
 * @param value - The value to stringify
 * @returns A JSON string safe to embed in markup-like wrappers
 */
export function stringifyJsonForMarkup(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new Error("Value is not JSON-serializable");
  }

  return json
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}
