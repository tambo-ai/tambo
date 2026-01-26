/**
 * JSON Patch Utilities (RFC 6902)
 *
 * Wrapper around fast-json-patch for applying JSON Patch operations.
 * Used to update component props and state during streaming.
 */

import { applyPatch, type Operation } from "fast-json-patch";

/**
 * Apply JSON Patch operations to an object.
 *
 * Returns a new object with patches applied without mutating the original.
 * @param target - The object to patch
 * @param operations - Array of JSON Patch operations
 * @returns New object with patches applied
 * @throws {Error} With context about the failed operation if patching fails
 */
export function applyJsonPatch<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): T {
  try {
    // Apply patches with mutate=false so fast-json-patch handles cloning
    const result = applyPatch(
      target,
      operations,
      /* validate */ true,
      /* mutate */ false,
    );

    return result.newDocument;
  } catch (error) {
    const opSummary = operations.map((op) => `${op.op} ${op.path}`).join(", ");
    throw new Error(
      `Failed to apply JSON patch operations [${opSummary}]: ` +
        `${error instanceof Error ? error.message : String(error)}. ` +
        `Target had keys: [${Object.keys(target).join(", ")}]`,
    );
  }
}
