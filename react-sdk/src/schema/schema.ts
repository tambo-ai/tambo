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
import {
  ParameterSpec,
  SupportedSchema,
  TamboTool,
  TamboToolWithToolSchema,
} from "../model/component-metadata";
import {
  getJsonSchemaTupleItems,
  isJsonSchemaTuple,
  looksLikeJSONSchema,
} from "./json-schema";
import { isStandardSchema } from "./standard-schema";
import { getZodFunctionArgs, handleZodSchemaToJson, isZodSchema } from "./zod";

// Register the Zod vendor converter with standard-json
loadVendor("zod", handleZodSchemaToJson);

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
 * Checks if a tool uses the new inputSchema interface (vs deprecated toolSchema).
 * @param tool - The Tambo tool to check
 * @returns True if the tool uses inputSchema
 */
export function hasInputSchema(
  tool: TamboTool | TamboToolWithToolSchema,
): tool is TamboTool {
  return "inputSchema" in tool && tool.inputSchema != null;
}

/**
 * Retrieves the input schema for a Tambo tool using the deprecated toolSchema.
 * For toolSchema, this extracts the args from the Zod function schema.
 * @param tool - The Tambo tool (potentially with toolSchema)
 * @returns The input schema (Standard Schema or JSON Schema), or undefined if not toolSchema
 */
function getArgsFromToolSchema(
  tool: TamboToolWithToolSchema,
): StandardSchemaV1 | JSONSchema7 | undefined {
  if (looksLikeJSONSchema(tool.toolSchema)) {
    return tool.toolSchema;
  }

  return getZodFunctionArgs(tool.toolSchema);
}

/**
 * Extracts parameter specifications from JSON Schema tuple items.
 * Supports both draft-07 (items as array) and draft 2020-12 (prefixItems).
 * This is library-agnostic - works with Zod, Valibot, ArkType, etc.
 * @param tupleItems - The array of JSON Schema items
 * @returns An array of parameter specifications
 */
function extractParamsFromJsonSchemaTuple(
  tupleItems: JSONSchema7[],
): ParameterSpec[] {
  return tupleItems.map((item, index) => ({
    name: `param${index + 1}`,
    type: typeof item.type === "string" ? item.type : "object",
    description: item.description ?? "",
    isRequired: true, // tuple items are positional
    schema: item,
  }));
}

/**
 * Creates a single parameter spec from an input schema.
 * Used for the new inputSchema interface where the schema represents
 * the shape of the single object argument to the tool function.
 * @param schema - The input schema (JSON Schema)
 * @returns A single parameter specification
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
 * Extracts parameter specifications from a tool schema.
 *
 * For tools with **inputSchema** (new interface):
 * - Returns a single parameter named "input" representing the object schema
 * - The inputSchema defines the shape of the single object argument
 *
 * For tools with **toolSchema** (deprecated):
 * - Extracts positional parameters from tuple/function args
 * - Returns params named "param1", "param2", etc.
 * @param tool - The tool containing the schema
 * @returns An array of parameter specifications
 */
export const getParametersFromToolSchema = (
  tool: TamboTool | TamboToolWithToolSchema,
): ParameterSpec[] => {
  // New interface: inputSchema represents the single object argument
  if (hasInputSchema(tool)) {
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

  // Deprecated interface: toolSchema with positional tuple args
  const argsSchema = getArgsFromToolSchema(tool);

  if (!argsSchema) {
    console.warn("No toolSchema found, returning empty parameters");
    return [];
  }

  // Convert to JSON Schema if needed
  let jsonSchema: JSONSchema7;
  // zod 3 and 4 are both compatible with StandardSchema
  if (isZodSchema(argsSchema)) {
    jsonSchema = handleZodSchemaToJson(argsSchema);
  } else if (isStandardSchema(argsSchema)) {
    // uses @standard-community/standard-json for conversion
    jsonSchema = schemaToJsonSchema(argsSchema);
  } else if (looksLikeJSONSchema(argsSchema)) {
    // already JSON Schema
    jsonSchema = argsSchema;
  } else {
    console.warn("Unknown toolSchema args type, returning empty parameters");
    return [];
  }

  // Extract tuple items for positional params
  if (isJsonSchemaTuple(jsonSchema)) {
    const tupleItems = getJsonSchemaTupleItems(jsonSchema) ?? [];
    return extractParamsFromJsonSchemaTuple(tupleItems);
  }

  // Fallback: wrap as single param (shouldn't normally happen for toolSchema)
  return extractParamsFromJsonSchemaTuple([jsonSchema]);
};

export type { SupportedSchema };
