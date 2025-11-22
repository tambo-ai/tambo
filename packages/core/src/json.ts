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
