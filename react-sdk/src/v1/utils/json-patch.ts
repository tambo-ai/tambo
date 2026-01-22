/**
 * JSON Patch Utilities (RFC 6902)
 *
 * Wrapper around fast-json-patch for applying JSON Patch operations.
 * Used to update component props and state during streaming.
 */

import { applyPatch, type Operation } from "fast-json-patch";
import type { JsonPatchOperation } from "../types/event";

/**
 * Apply JSON Patch operations to an object.
 * @param target - The object to patch
 * @param operations - Array of JSON Patch operations
 * @returns New object with patches applied
 */
export function applyJsonPatch<T extends Record<string, unknown>>(
  target: T,
  operations: JsonPatchOperation[],
): T {
  // fast-json-patch mutates the target, so we clone it first
  const cloned = structuredClone(target);

  // Convert our operations to fast-json-patch format
  const patchOperations: Operation[] = operations as unknown as Operation[];

  // Apply the patches
  const result = applyPatch(
    cloned,
    patchOperations,
    /* validate */ true,
    /* mutate */ false,
  );

  return result.newDocument;
}
