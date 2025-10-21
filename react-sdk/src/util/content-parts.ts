import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Narrow a value to a ChatCompletionContentPart by checking for an object with string `type`.
 * We purposefully keep this guard permissive to support future part types.
 * @returns true if the value looks like a content part
 */
export function isContentPart(
  val: unknown,
): val is TamboAI.Beta.Threads.ChatCompletionContentPart {
  return (
    !!val &&
    typeof val === "object" &&
    "type" in (val as any) &&
    typeof (val as any).type === "string"
  );
}

/**
 * Type guard for arrays of content parts.
 * @returns true if the value is an array of content parts
 */
export function isContentPartArray(
  val: unknown,
): val is TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  return Array.isArray(val) && val.every((item) => isContentPart(item));
}

/**
 * Safely convert an unknown value to a string suitable for a `{ type: "text" }` content part.
 * Guarantees a string and avoids throwing on circular structures.
 * @returns The string representation of the value
 */
export function toText(val: unknown): string {
  if (typeof val === "string") return val;
  try {
    const json = JSON.stringify(val);
    return json ?? String(val);
  } catch {
    return String(val);
  }
}
