import { JSONSchema7, JSONSchema7Definition } from "json-schema";
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
 * Makes a single JSON Schema property nullable using the anyOf pattern.
 * Handles schemas that are already nullable (via anyOf or type array).
 *
 * Uses `anyOf: [originalSchema, {type: "null"}]` because LLMs reliably
 * interpret this form. The `type: ["string", "null"]` array form (produced
 * by Zod v3 for simple types) is NOT reliably handled by LLMs, so we
 * normalize it to anyOf as well.
 * @param propSchema - The property schema to make nullable
 * @returns A new schema that also allows null
 */
function makePropertyNullable(
  propSchema: JSONSchema7Definition,
): JSONSchema7Definition {
  if (typeof propSchema === "boolean") {
    return propSchema;
  }

  // Already just {type: "null"}
  if (propSchema.type === "null") {
    return propSchema;
  }

  const hasNullVariant = (
    variants: JSONSchema7["anyOf"] | JSONSchema7["oneOf"],
  ) =>
    variants?.some((s) => typeof s !== "boolean" && s.type === "null") ?? false;

  // Already nullable via anyOf containing {type: "null"}
  if (hasNullVariant(propSchema.anyOf)) {
    return propSchema;
  }

  // Already nullable via oneOf containing {type: "null"}
  if (hasNullVariant(propSchema.oneOf)) {
    return propSchema;
  }

  // Existing anyOf without null — flatten by appending {type: "null"} to avoid nesting
  if (propSchema.anyOf) {
    return { ...propSchema, anyOf: [...propSchema.anyOf, { type: "null" }] };
  }

  // Normalize type: [T, "null"] array form to anyOf (LLMs don't handle the array form)
  if (Array.isArray(propSchema.type) && propSchema.type.includes("null")) {
    const { type: _type, ...rest } = propSchema;
    const baseSchemas = propSchema.type
      .filter((t) => t !== "null")
      .map((t) => ({ ...rest, type: t as JSONSchema7["type"] }));
    return { anyOf: [...baseSchemas, { type: "null" }] };
  }

  // Not yet nullable — wrap in anyOf
  return { anyOf: [{ ...propSchema }, { type: "null" }] };
}

/**
 * Creates a partial version of a JSON Schema by removing required constraints
 * and making all properties nullable via the anyOf pattern. This allows the
 * LLM to provide only the properties it wants to update, and to send null
 * to clear optional fields.
 * @param schema - The JSON Schema to make partial
 * @returns A new JSON Schema with required removed and all properties nullable
 */
export function makeJsonSchemaPartial(schema: JSONSchema7): JSONSchema7 {
  const { required: _required, ...rest } = schema;

  if (!rest.properties) {
    return rest;
  }

  const nullableProperties: Record<string, JSONSchema7Definition> = {};
  for (const [key, propSchema] of Object.entries(rest.properties)) {
    nullableProperties[key] = makePropertyNullable(propSchema);
  }

  return { ...rest, properties: nullableProperties };
}
