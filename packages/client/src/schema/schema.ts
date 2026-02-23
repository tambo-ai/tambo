/**
 * Schema utilities for working with Standard Schema and JSON Schema.
 *
 * This module provides a unified interface for handling different schema types
 * used in Tambo components and tools. It uses Standard Schema (https://standardschema.dev/)
 * as the primary interface, which is implemented by Zod 3.24+ and other validation libraries.
 *
 * JSON Schema conversion is handled by `@standard-community/standard-json`.
 * @module schema
 */

import { loadVendor, toJsonSchema } from "@standard-community/standard-json";
import type { JSONSchema7 } from "json-schema";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toJSONSchema as zod4ToJSONSchema } from "zod/v4/core";
import {
  ParameterSpec,
  SupportedSchema,
  TamboTool,
} from "../model/component-metadata";
import { looksLikeJSONSchema } from "./json-schema";
import { isStandardSchema } from "./standard-schema";

/**
 * Register the zod vendor handler for synchronous JSON Schema conversion.
 * This uses Zod 4's native toJSONSchema for Zod 4.x schemas and zod-to-json-schema for Zod 3.x.
 */
loadVendor("zod", (schema: unknown): JSONSchema7 => {
  // Check if this is a Zod 4 schema (has _zod property)
  if (schema && typeof schema === "object" && "_zod" in schema) {
    // Use Zod 4's native toJSONSchema from zod/v4/core
    // Cast through unknown since the Zod 4 internal types don't match our detection pattern
    return zod4ToJSONSchema(
      schema as unknown as Parameters<typeof zod4ToJSONSchema>[0],
    ) as JSONSchema7;
  }
  // Fall back to zod-to-json-schema for Zod 3.x
  return zodToJsonSchema(
    schema as Parameters<typeof zodToJsonSchema>[0],
  ) as JSONSchema7;
});

/**
 * Converts a schema (Standard Schema or JSON Schema) to a JSON Schema object.
 *
 * If the schema is already a JSON Schema, it is returned as-is.
 * For Standard Schema validators (Zod 3.24+, etc.), uses
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
export function schemaToJsonSchema(schema: SupportedSchema): JSONSchema7 {
  // Already a JSON Schema - return as-is
  if (!isStandardSchema(schema)) {
    return schema;
  }

  return toJsonSchema.sync(schema) as JSONSchema7;
}

/**
 * Safely converts a schema to JSON Schema, returning undefined for invalid inputs.
 * @param schema - The schema to convert (may be undefined)
 * @param onError - Optional callback invoked on conversion error
 * @returns The JSON Schema representation, or undefined if conversion fails
 */
export function safeSchemaToJsonSchema(
  schema: SupportedSchema | undefined | null,
  onError?: (error: unknown) => void,
): JSONSchema7 | undefined {
  if (!schema) {
    return undefined;
  }

  try {
    return schemaToJsonSchema(schema);
  } catch (error) {
    console.error("Error converting schema to JSON Schema:", error);
    onError?.(error);
    return undefined;
  }
}

/**
 * Creates parameter specs from an input schema.
 * The schema represents the shape of the single object argument to the tool function.
 * @param schema - The input schema (JSON Schema)
 * @returns An array of parameter specifications
 */
function createParametersFromSchema(schema: JSONSchema7): ParameterSpec[] {
  const properties = schema.properties ?? {};

  return Object.entries(properties).map(
    ([key, propSchema]) =>
      ({
        name: key,
        type:
          propSchema && typeof propSchema === "object" && "type" in propSchema
            ? (propSchema.type as string)
            : "object",
        description:
          propSchema &&
          typeof propSchema === "object" &&
          "description" in propSchema
            ? (propSchema.description ?? "")
            : "",
        isRequired: Array.isArray(schema.required)
          ? schema.required.includes(key)
          : false,
        schema:
          typeof propSchema === "object" && propSchema !== null
            ? propSchema
            : {},
      }) satisfies ParameterSpec,
  );
}

/**
 * Extracts parameter specifications from a tool's inputSchema.
 * @param tool - The tool containing the schema
 * @returns An array of parameter specifications
 */
export function getParametersFromToolSchema(tool: TamboTool): ParameterSpec[] {
  const schema = tool.inputSchema;

  // Convert to JSON Schema if needed
  let jsonSchema: JSONSchema7;
  if (looksLikeJSONSchema(schema)) {
    jsonSchema = schema;
  } else if (isStandardSchema(schema)) {
    jsonSchema = schemaToJsonSchema(schema);
  } else {
    console.warn("Unknown inputSchema type, returning empty parameters");
    return [];
  }

  return createParametersFromSchema(jsonSchema);
}

export type { SupportedSchema };
