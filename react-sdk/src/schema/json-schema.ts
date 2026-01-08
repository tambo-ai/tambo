import { JSONSchema7 } from "json-schema";
import { z } from "zod/v4";

const jsonSchemaType = z.union([
  z.literal("object"),
  z.literal("array"),
  z.literal("string"),
  z.literal("number"),
  z.literal("integer"),
  z.literal("boolean"),
  z.literal("null"),
  z.array(
    z.union([
      z.literal("object"),
      z.literal("array"),
      z.literal("string"),
      z.literal("number"),
      z.literal("integer"),
      z.literal("boolean"),
      z.literal("null"),
    ]),
  ),
]);

const jsonSchemaTopLevel = z
  .looseObject({
    type: jsonSchemaType.optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
    items: z.union([z.array(z.unknown()), z.unknown()]).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.union([z.boolean(), z.unknown()]).optional(),
    enum: z.array(z.unknown()).optional(),
    const: z.unknown().optional(),
    $ref: z.string().optional(),
    $id: z.string().optional(),
    $schema: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((value) => {
    return (
      value.type !== undefined ||
      value.properties !== undefined ||
      value.items !== undefined ||
      value.enum !== undefined ||
      value.const !== undefined ||
      value.$ref !== undefined
    );
  });

/**
 * Basic heuristic to check if an object looks like a JSON Schema at the top level.
 *
 * This uses a Zod schema to verify only top-level keys (type, properties, items,
 * etc.). It intentionally does not perform full JSON Schema validation; a more
 * thorough check should be done server-side.
 * @param obj - The value to check
 * @returns True if the value appears to be a JSON Schema
 */
export function looksLikeJSONSchema(obj: unknown): obj is JSONSchema7 {
  if (obj === null || typeof obj !== "object") {
    return false;
  }

  return jsonSchemaTopLevel.safeParse(obj).success;
}

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

/**
 * Creates a partial version of a JSON Schema by removing required constraints.
 * This allows LLM to provide only the properties it wants to update.
 * @param schema - The JSON Schema to make partial
 * @returns A new JSON Schema with the required constraint removed
 */
export function makeJsonSchemaPartial(schema: JSONSchema7): JSONSchema7 {
  const { required: _required, ...rest } = schema;
  return rest;
}
