/**
 * Schema utilities for working with Standard Schema, Zod, and JSON Schema.
 *
 * This module provides a unified interface for handling different schema types
 * used in Tambo components and tools. It uses Standard Schema (https://standardschema.dev/)
 * as the primary interface, which is implemented by Zod and other validation libraries.
 *
 * JSON Schema conversion is handled by `@standard-community/standard-json`, with:
 * - Zod 4: Uses Zod's native toJSONSchema
 * - Zod 3: Requires optional peer dependency 'zod-to-json-schema'
 * - Other vendors: Handled by standard-json's built-in converters
 * @module schema
 */

import { loadVendor, toJsonSchema } from "@standard-community/standard-json";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { JSONSchema7 } from "json-schema";
import type { ZodFunction, ZodTuple, ZodType, ZodTypeAny } from "zod/v3";
import { z } from "zod/v4";
import { $ZodType, toJSONSchema as zod4ToJSONSchema } from "zod/v4/core";

/**
 * A schema type that accepts either a Standard Schema compliant validator
 * (e.g., Zod, Valibot, ArkType) or a raw JSON Schema object.
 *
 * Standard Schema is a specification that provides a unified interface for
 * TypeScript validation libraries. Libraries like Zod implement this spec,
 * allowing us to accept any compliant validator without depending on a specific library.
 * @see https://standardschema.dev/
 */
export type Schema = StandardSchemaV1 | JSONSchema7;

const standardSchemaProps = z.object({
  version: z.literal(1),
  vendor: z.string(),
  validate: z.function({
    input: [z.unknown()],
    output: z.union([z.unknown(), z.promise(z.unknown())]),
  }),
});

const standardSchemaObject = z.object({
  "~standard": standardSchemaProps,
});

/**
 * Type guard to check if an object implements the Standard Schema interface.
 *
 * Standard Schema compliant validators have a `~standard` property containing
 * metadata about the schema including version, vendor, and validate function.
 * @param obj - The object to check
 * @returns True if the object implements StandardSchemaV1
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * const zodSchema = z.object({ name: z.string() });
 * isStandardSchema(zodSchema); // true
 *
 * const jsonSchema = { type: "object", properties: { name: { type: "string" } } };
 * isStandardSchema(jsonSchema); // false
 * ```
 */
export function isStandardSchema(obj: unknown): obj is StandardSchemaV1 {
  return standardSchemaObject.safeParse(obj).success;
}

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
  .object({
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
  .passthrough()
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

  if (isStandardSchema(obj)) {
    return false;
  }

  return jsonSchemaTopLevel.safeParse(obj).success;
}

/**
 * Type guard to check if a schema is a Zod 3 function schema.
 * Zod 3 function schemas have `_def.typeName === "ZodFunction"`.
 * Uses the shared Zod schema guard from `schema.ts` to ensure the
 * input looks like a Zod schema before inspecting internals.
 * @returns True if the schema is a Zod 3 function schema
 */
export function isZod3FunctionSchema(
  schema: unknown,
): schema is ZodFunction<ZodTuple<any, any>, ZodTypeAny> {
  if (!isZod3Schema(schema)) {
    return false;
  }

  return "typeName" in schema._def && schema._def.typeName === "ZodFunction";
}

/**
 * Extracts the args schema from a Zod 3 function schema.
 * @param schema - The Zod 3 function schema
 * @returns The args schema, or undefined if not a Zod 3 function schema
 * @deprecated This function will be removed in the next major version.
 */
export function getZodFunctionArgs(schema: unknown): unknown | undefined {
  if (isZod3FunctionSchema(schema)) {
    // Zod 3 uses `_def.args` for function args
    return schema._def?.args;
  }

  return undefined;
}

const zod3SchemaType = z.object({
  _def: z.object({
    args: z.unknown().optional(),
    typeName: z.string().optional(),
    returns: z.unknown().optional(),
  }),
  "~standard": standardSchemaProps,
});

/**
 * Checks if a schema is probably a Zod 3 schema.
 * @param schema - The schema to check
 * @returns True if the schema looks like a Zod 3 schema
 */
export function isZod3Schema(schema: unknown): schema is ZodType {
  return zod3SchemaType.safeParse(schema).success;
}

const zod4SchemaType = z.object({
  def: z.object(),
  _zod: z.looseObject({
    def: z.looseObject({}),
  }),
  "~standard": standardSchemaProps,
});

/**
 * Detects if a schema is Zod 4 by checking for def.type property.
 * Zod 4 uses `def.type` with lowercase type names like "object", "string".
 * @returns True if the schema appears to be Zod 4 style
 */
export function isZod4Schema(schema: unknown): schema is $ZodType {
  return zod4SchemaType.safeParse(schema).success;
}

/**
 * Checks if a schema is a Zod schema
 * @param schema - The schema to check
 * @returns True if the schema is a Zod schema
 */
export function isZodSchema(
  schema: unknown,
): ReturnType<typeof isZod3Schema> | ReturnType<typeof isZod4Schema> {
  return isZod3Schema(schema) || isZod4Schema(schema);
}

// Register the Zod vendor converter with standard-json
loadVendor("zod", (schema: unknown) => {
  // Detect Zod 4 by checking for def.type
  if (isZod4Schema(schema)) return zod4ToJSONSchema(schema);

  try {
    // Dynamic require for optional peer dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- need require because zod-to-json-schema may be missing
    const { zodToJsonSchema } = require("zod-to-json-schema");
    return zodToJsonSchema(schema);
  } catch (error) {
    throw new Error(
      "Zod 3 requires 'zod-to-json-schema' package for JSON Schema conversion. " +
        "Install it with: npm install zod-to-json-schema",
      {
        cause: error,
      },
    );
  }
});

// Register the Valibot vendor converter with standard-json
loadVendor("valibot", (schema: unknown) => {
  try {
    // Dynamic require for optional peer dependency
    /* eslint-disable @typescript-eslint/no-require-imports -- need require because @valibot/to-json-schema may be missing */
    const {
      toJsonSchema: valibotToJsonSchema,
    } = require("@valibot/to-json-schema");
    /* eslint-enable @typescript-eslint/no-require-imports */
    return valibotToJsonSchema(schema);
  } catch (error) {
    throw new Error(
      "Valibot requires '@valibot/to-json-schema' package for JSON Schema conversion. " +
        "Install it with: npm install @valibot/to-json-schema",
      {
        cause: error,
      },
    );
  }
});

/**
 * Converts a schema (Standard Schema or JSON Schema) to a JSON Schema object.
 *
 * If the schema is already a JSON Schema, it is returned as-is.
 * For Standard Schema validators (Zod, Valibot, ArkType, etc.), uses
 * `@standard-community/standard-json` for conversion.
 * @param schema - The schema to convert
 * @returns The JSON Schema representation
 * @example
 * ```typescript
 * import { z } from "zod/v4";
 *
 * // Convert a Zod schema
 * const zodSchema = z.object({ name: z.string() });
 * const jsonSchema = schemaToJsonSchema(zodSchema);
 *
 * // Pass through a JSON Schema
 * const existingJsonSchema = { type: "object", properties: { name: { type: "string" } } };
 * schemaToJsonSchema(existingJsonSchema); // returns the same object
 * ```
 */
export function schemaToJsonSchema(schema: Schema): JSONSchema7 {
  // Already a JSON Schema - return as-is
  if (!isStandardSchema(schema)) {
    return schema;
  }

  return toJsonSchema.sync(schema) as JSONSchema7;
}

/**
 * Safely converts a schema to JSON Schema, returning undefined for invalid inputs.
 * @param schema - The schema to convert (may be undefined)
 * @returns The JSON Schema representation, or undefined if conversion fails
 */
export function safeSchemaToJsonSchema(
  schema: Schema | undefined | null,
): JSONSchema7 | undefined {
  if (!schema) {
    return undefined;
  }

  try {
    return schemaToJsonSchema(schema);
  } catch (error) {
    console.error("Error converting schema to JSON Schema:", error);
    return undefined;
  }
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
