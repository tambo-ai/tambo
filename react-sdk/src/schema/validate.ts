import type { JSONSchema7 } from "json-schema";
import { schemaToJsonSchema } from "./schema";
import { isStandardSchema } from "./standard-schema";

/*
 * Check if a JSON Schema represents a record type (map with dynamic keys).
 *
 * For our purposes, any `object` schema with `additionalProperties` defined
 * as a nested schema (not just `true`/`false`) is treated as a record, even
 * if it also declares some explicit `properties`.
 * @param schema - The JSON Schema to check
 * @returns True if the schema represents a record-like type
 */
function isRecordJsonSchema(schema: JSONSchema7): boolean {
  return (
    schema.type === "object" &&
    typeof schema.additionalProperties === "object" &&
    schema.additionalProperties !== null
  );
}

/**
 * Recursively walks a JSON Schema and throws when it encounters a record type.
 * Records are not supported because they use dynamic keys which don't serialize
 * well for the Tambo backend.
 * @param schema - The JSON Schema to check
 * @param path - Current path in the schema (for error messages)
 * @param contextName - Human-readable context name for error messages
 */
function assertNoRecordInJsonSchema(
  schema: JSONSchema7,
  path: string[],
  contextName: string,
): void {
  if (isRecordJsonSchema(schema)) {
    const joined = path.length ? path.join(".") : "(root)";
    throw new Error(
      `Record types (objects with dynamic keys) are not supported in ${contextName}. ` +
        `Found at path "${joined}". ` +
        "Replace it with an object using explicit keys.",
    );
  }
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema === "object" && propSchema !== null) {
        assertNoRecordInJsonSchema(propSchema, [...path, key], contextName);
      }
    }
  }
  if (
    typeof schema.additionalProperties === "object" &&
    schema.additionalProperties !== null
  ) {
    assertNoRecordInJsonSchema(
      schema.additionalProperties,
      [...path, "[*]"],
      contextName,
    );
  }
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      // Tuple (JSON Schema draft-07): check each item schema
      schema.items.forEach((itemSchema, index) => {
        if (typeof itemSchema === "object" && itemSchema !== null) {
          assertNoRecordInJsonSchema(
            itemSchema,
            [...path, `${index}`],
            contextName,
          );
        }
      });
    } else if (typeof schema.items === "object") {
      // Array: check the item schema
      assertNoRecordInJsonSchema(schema.items, [...path, "[]"], contextName);
    }
  }
  const prefixItems = (schema as Record<string, unknown>).prefixItems;
  if (Array.isArray(prefixItems)) {
    prefixItems.forEach((itemSchema, index) => {
      if (typeof itemSchema === "object" && itemSchema !== null) {
        assertNoRecordInJsonSchema(
          itemSchema as JSONSchema7,
          [...path, `${index}`],
          contextName,
        );
      }
    });
  }
  if (schema.allOf) {
    schema.allOf.forEach((subSchema, index) => {
      if (typeof subSchema === "object" && subSchema !== null) {
        assertNoRecordInJsonSchema(
          subSchema,
          [...path, `&${index}`],
          contextName,
        );
      }
    });
  }
  if (schema.anyOf) {
    schema.anyOf.forEach((subSchema, index) => {
      if (typeof subSchema === "object" && subSchema !== null) {
        assertNoRecordInJsonSchema(
          subSchema,
          [...path, `|${index}`],
          contextName,
        );
      }
    });
  }
  if (schema.oneOf) {
    schema.oneOf.forEach((subSchema, index) => {
      if (typeof subSchema === "object" && subSchema !== null) {
        assertNoRecordInJsonSchema(
          subSchema,
          [...path, `|${index}`],
          contextName,
        );
      }
    });
  }
  if (typeof schema.not === "object" && schema.not !== null) {
    assertNoRecordInJsonSchema(schema.not, [...path, "!"], contextName);
  }
  if (typeof schema.if === "object" && schema.if !== null) {
    assertNoRecordInJsonSchema(schema.if, [...path, "if"], contextName);
  }
  if (typeof schema.then === "object" && schema.then !== null) {
    assertNoRecordInJsonSchema(schema.then, [...path, "then"], contextName);
  }
  if (typeof schema.else === "object" && schema.else !== null) {
    assertNoRecordInJsonSchema(schema.else, [...path, "else"], contextName);
  }
}

/**
 * Asserts that a schema does not contain record types (objects with dynamic keys).
 * Records are not serializable to JSON Schema in a way that the Tambo backend
 * understands, so they are disallowed.
 *
 * This function accepts Standard Schema validators (Zod, Valibot, ArkType, etc.)
 * or JSON Schema objects. It converts them to JSON Schema and checks for record patterns.
 *
 * For tool schemas that are function types, this extracts and validates the input parameters.
 * @param schema - The schema to validate (Standard Schema or JSON Schema)
 * @param contextName - A human-readable label echoed in the error message
 */
export function assertNoRecordSchema(
  schema: unknown,
  contextName = "schema",
): void {
  if (!schema) {
    return;
  }

  let jsonSchema: JSONSchema7;

  try {
    if (isStandardSchema(schema)) {
      // Handle function schemas specially - extract input parameters
      const converted = schemaToJsonSchema(schema);

      // If it's a function schema that couldn't be converted, the input params
      // were extracted in registry.ts, so we can skip validation here
      if (!converted || Object.keys(converted).length === 0) {
        return;
      }

      jsonSchema = converted;
    } else if (
      typeof schema === "object" &&
      schema !== null &&
      "type" in schema
    ) {
      // Already JSON Schema
      jsonSchema = schema as JSONSchema7;
    } else {
      // Unknown schema type - skip validation
      return;
    }
  } catch {
    // If schema conversion fails, skip validation
    // This can happen for function schemas or other special types
    return;
  }

  assertNoRecordInJsonSchema(jsonSchema, [], contextName);
}
