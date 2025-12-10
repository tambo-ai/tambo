import { ZodSchema } from "zod/v3";
import zodToJsonSchema from "zod-to-json-schema";

/**
 * Checks if the propsSchema is a JSON Schema. This is a rough check, and the
 * server will provide the definitive check.
 * @param propsSchema - The props schema to check
 * @returns True if the props schema is a JSON Schema, false otherwise
 */
export function isJSONSchema(propsSchema: unknown): boolean {
  return (
    !!propsSchema &&
    typeof propsSchema === "object" &&
    (propsSchema as any).type === "object" &&
    !!(propsSchema as any).properties
  );
}

/**
 * Since we require a certain zod version, we need to check if the object is a ZodSchema
 * @param obj - The object to check
 * @returns True if the object is a ZodSchema, false otherwise
 */
export function isZodSchema(obj: unknown): obj is ZodSchema {
  if (obj instanceof ZodSchema) {
    return true;
  }
  // try to detect if the object is a ZodSchema
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).safeParse === "function" &&
    typeof (obj as any)._def === "object"
  );
}

/**
 * Converts a props schema (either Zod or JSON Schema) to a serialized JSON Schema format.
 * @param propsDefinition - Deprecated: legacy props definition (will log warning)
 * @param propsSchema - The props schema (Zod or JSON Schema)
 * @param name - Component/tool name for error messages
 * @returns Serialized JSON Schema object
 */
export function getSerializedProps(
  propsDefinition: unknown,
  propsSchema: unknown,
  name: string,
): Record<string, unknown> {
  if (propsDefinition) {
    console.warn(`propsDefinition is deprecated. Use propsSchema instead.`);
    return propsDefinition as Record<string, unknown>;
  }

  if (isZodSchema(propsSchema)) {
    try {
      return zodToJsonSchema(propsSchema) as Record<string, unknown>;
    } catch (error) {
      console.error(
        `Error converting ${name} props schema to JSON Schema:`,
        error,
      );
      throw new Error(
        `Error converting ${name} props schema to JSON Schema: ${error}`,
      );
    }
  }
  // try to roughly detect JSONSchema, should always be an object with a properties key
  if (isJSONSchema(propsSchema)) {
    return propsSchema as Record<string, unknown>;
  }

  throw new Error(`Invalid props schema for ${name}`);
}
