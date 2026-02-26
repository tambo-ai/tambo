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
 * Stringify a value as JSON safe to embed in an XML/HTML element text node.
 *
 * This keeps the output valid JSON while preventing `<`, `>`, and `&` from
 * appearing literally.
 *
 * Not safe for embedding in attributes or script contexts.
 *
 * Throws if the value is not JSON-serializable (for example, circular
 * references).
 *
 * @param value - The value to stringify
 * @returns A JSON string safe to embed in an XML/HTML element text node
 */
export function stringifyJsonForMarkupText(value: unknown): string {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch (error) {
    throw new Error("Value is not JSON-serializable", {
      cause: error,
    });
  }

  if (json === undefined) {
    throw new Error("Value is not JSON-serializable");
  }

  // Intentionally avoid String.prototype.replaceAll for runtime compatibility.
  return json.replace(/[<>&]/g, (character) => {
    switch (character) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      default:
        return character;
    }
  });
}

/**
 * @deprecated Use stringifyJsonForMarkupText instead.
 * @param value - The value to stringify
 * @returns A JSON string safe to embed in an XML/HTML element text node
 */
export function stringifyJsonForMarkup(value: unknown): string {
  return stringifyJsonForMarkupText(value);
}
