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
 */
export function applyJsonPatch<T extends Record<string, unknown>>(
  target: T,
  operations: Operation[],
): T {
  // Apply patches with mutate=false so fast-json-patch handles cloning
  const result = applyPatch(
    target,
    operations,
    /* validate */ true,
    /* mutate */ false,
  );

  return result.newDocument;
}
