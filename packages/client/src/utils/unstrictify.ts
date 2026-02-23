/**
 * Unstrictify tool call parameters using the original JSON Schema.
 *
 * When OpenAI's structured outputs mode is enabled, all optional parameters
 * become required-and-nullable. The LLM then sends `null` for parameters the
 * user didn't specify. This module reverses that transformation by comparing
 * the LLM's output against the original schema and stripping nulls for
 * parameters that were originally optional and non-nullable.
 *
 * Copied from packages/core/src/strictness/tool-call-strict.ts (minus the
 * OpenAI-specific `unstrictifyToolCallRequest` wrapper).
 */

import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

/**
 * Unstrictify the parameters of a tool call request.
 *
 * This effectively reverses the process of strictifyToolCallParams, for a
 * tool call request that was built from a strict JSON Schema, by returning a
 * updated tool call request with the parameter values unstrictified.
 */
function unstrictifyToolCallParams(
  originalToolParamSchema: JSONSchema7,
  toolCallRequestParams: Record<string, unknown>,
): Record<string, unknown> {
  if (originalToolParamSchema.type !== "object") {
    throw new Error(
      `tool call parameter schema must be an object, instead got ${originalToolParamSchema.type} / ${typeof originalToolParamSchema}`,
    );
  }
  const newParams = Object.entries(toolCallRequestParams)
    .map(([parameterName, parameterValue]) => {
      const isRequired =
        originalToolParamSchema.required?.includes(parameterName);
      // find the param in the original tool schema
      const originalParamSchema =
        parameterName in (originalToolParamSchema.properties ?? {})
          ? originalToolParamSchema.properties?.[parameterName]
          : undefined;

      // This should never happen, because the strict schema was derived from
      // the original schema, so the parameter should always be present.
      if (!originalParamSchema) {
        throw new Error(
          `Tool call request parameter ${parameterName} not found in original tool`,
        );
      }

      if (
        parameterValue === null &&
        !canBeNull(originalParamSchema) &&
        !isRequired
      ) {
        // This is the meat of this function. In the strict schema, this is
        // "required and can be null", but in the original schema, the param was
        // not required.
        if (
          typeof originalParamSchema === "object" &&
          "default" in originalParamSchema
        ) {
          return [parameterName, originalParamSchema.default] as const;
        }
        return undefined;
      }

      // recurse into arrays
      if (
        typeof originalParamSchema === "object" &&
        originalParamSchema.type === "array"
      ) {
        const arrayValue = parameterValue as unknown[];
        const itemSchema = originalParamSchema.items;
        if (
          Array.isArray(arrayValue) &&
          itemSchema &&
          typeof itemSchema === "object" &&
          !Array.isArray(itemSchema)
        ) {
          const newArrayValue = arrayValue.map((item) => {
            if (
              itemSchema.type === "object" &&
              typeof item === "object" &&
              item !== null
            ) {
              // recurse into each object in the array
              return unstrictifyToolCallParams(
                itemSchema,
                item as Record<string, unknown>,
              );
            }
            return item;
          });
          return [parameterName, newArrayValue] as const;
        }
        return [parameterName, parameterValue] as const;
      }

      // recurse into the parameter value, passing along the matching original schema
      if (
        typeof originalParamSchema === "object" &&
        originalParamSchema.type === "object"
      ) {
        // If the LLM sent a JSON string instead of an object (common with z.any() schemas),
        // try to parse it
        let objectValue = parameterValue;
        if (typeof parameterValue === "string") {
          try {
            const parsed = JSON.parse(parameterValue);
            if (typeof parsed === "object" && parsed !== null) {
              objectValue = parsed;
            }
          } catch {
            // Not valid JSON, keep original value
          }
        }

        // Only recurse if we have an actual object AND the schema has properties defined.
        // If the schema has no properties (e.g., z.any() which produces {type: 'object', anyOf: [...]}),
        // just return the value as-is without recursing.
        const hasProperties =
          originalParamSchema.properties &&
          Object.keys(originalParamSchema.properties).length > 0;

        if (
          hasProperties &&
          typeof objectValue === "object" &&
          objectValue !== null &&
          !Array.isArray(objectValue)
        ) {
          const newParamValue = unstrictifyToolCallParams(
            originalParamSchema,
            objectValue as Record<string, unknown>,
          );
          return [parameterName, newParamValue] as const;
        }

        // Return the (possibly parsed) object value without recursing
        return [parameterName, objectValue] as const;
      }

      return [parameterName, parameterValue] as const;
    })
    .filter((param) => param !== undefined);
  return Object.fromEntries(newParams);
}

/**
 * Unstrictify tool call params using the original JSON Schema.
 *
 * Unlike the private `unstrictifyToolCallParams` which throws on unknown params,
 * this function separates params into schema-defined vs `_tambo_*` pass-through
 * (server-injected params not in the original schema), unstrictifies only the
 * schema-defined ones, and merges pass-through params back. Unknown keys that
 * aren't in the schema and don't have the `_tambo_` prefix are dropped.
 * @returns The params with strictification-induced nulls stripped for optional
 * non-nullable properties, and pass-through params preserved as-is.
 */
export function unstrictifyToolCallParamsFromSchema(
  originalSchema: JSONSchema7,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (originalSchema.type !== "object") {
    return params;
  }

  const schemaProperties = originalSchema.properties ?? {};
  const schemaDefinedParams: Record<string, unknown> = {};
  const passThroughParams: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (key in schemaProperties) {
      schemaDefinedParams[key] = value;
    } else if (key.startsWith("_tambo_")) {
      passThroughParams[key] = value;
    }
    // Unknown keys not in schema and not _tambo_* are dropped —
    // they're likely hallucinated by the model.
  }

  const unstrictified = unstrictifyToolCallParams(
    originalSchema,
    schemaDefinedParams,
  );

  return { ...unstrictified, ...passThroughParams };
}

/**
 * Check if a JSON Schema definition allows null values.
 * @param originalSchema - The schema definition to check
 * @returns True if the schema allows null values
 */
export function canBeNull(originalSchema: JSONSchema7Definition): boolean {
  if (typeof originalSchema !== "object") {
    return false;
  }

  if (originalSchema.type === "null") {
    return true;
  }

  if (originalSchema.anyOf?.some((anyOf) => canBeNull(anyOf))) {
    return true;
  }
  return false;
}
