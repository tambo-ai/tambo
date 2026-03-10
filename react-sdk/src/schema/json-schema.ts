// Re-exported from @tambo-ai/client
export { looksLikeJSONSchema, makeJsonSchemaPartial } from "@tambo-ai/client";

// These types and functions are only used internally within the react-sdk
// and are not exported from @tambo-ai/client. Keep local definitions.
import { JSONSchema7 } from "json-schema";

/**
 * Extended JSON Schema type that includes draft 2020-12 features like prefixItems.
 * The json-schema package types are from draft-07 and don't include prefixItems.
 */
export type JSONSchema7Extended = JSONSchema7 & {
  prefixItems?: JSONSchema7[];
};

/**
 * Checks if a JSON Schema represents a tuple (array with positional items).
 * Supports both draft-07 (items as array) and draft 2020-12 (prefixItems).
 * @param schema - The JSON Schema to check
 * @returns True if the schema represents a tuple
 */
export function isJsonSchemaTuple(
  schema: JSONSchema7Extended,
): schema is JSONSchema7Extended & { type: "array" } {
  if (schema.type !== "array") {
    return false;
  }

  // Draft 2020-12: prefixItems array
  if (schema.prefixItems && Array.isArray(schema.prefixItems)) {
    return true;
  }

  // Draft-07: items as array (not object)
  if (Array.isArray(schema.items)) {
    return true;
  }

  return false;
}

/**
 * Gets the tuple items from a JSON Schema.
 * Supports both draft-07 (items as array) and draft 2020-12 (prefixItems).
 * @param schema - The JSON Schema tuple
 * @returns Array of item schemas, or undefined if not a tuple
 */
export function getJsonSchemaTupleItems(
  schema: JSONSchema7Extended,
): JSONSchema7[] | undefined {
  if (schema.type !== "array") {
    return undefined;
  }

  // Draft 2020-12: prefixItems array
  if (schema.prefixItems && Array.isArray(schema.prefixItems)) {
    return schema.prefixItems;
  }

  // Draft-07: items as array
  if (Array.isArray(schema.items)) {
    return schema.items as JSONSchema7[];
  }

  return undefined;
}
