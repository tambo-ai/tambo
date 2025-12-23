import { JSONSchema7 } from "json-schema";
import {
  ZodFunction,
  ZodTuple,
  ZodTupleItems,
  ZodType,
  ZodTypeAny,
} from "zod/v3";
import {
  $ZodFunction,
  $ZodType,
  toJSONSchema as zod4ToJSONSchema,
} from "zod/v4/core";

/**
 * @returns True if the schema is a Zod 3 function schema
 */
export function isZod3FunctionSchema(
  schema: unknown,
): schema is ZodFunction<ZodTuple<ZodTupleItems, any>, ZodTypeAny> {
  if (!isZodSchema(schema)) return false;

  return (
    "_def" in schema &&
    "typeName" in schema._def &&
    schema._def.typeName === "ZodFunction"
  );
}

/**
 * @returns True if the schema is a Zod 4 function schema
 */
export function isZod4FunctionSchema(schema: unknown): schema is $ZodFunction {
  if (!isZod4Schema(schema)) {
    return false;
  }

  // $ZodFunctions in zod 4.0 most certainly do have .def.type === "function"
  // but the type definitions do not reflect this because $ZodFunction does not
  // extend $ZodType. This is corrected in zod 4.1, but zod 3 does not include
  // the types for 4.1 yet (and might not ever).
  // See: https://github.com/colinhacks/zod/blob/463f03eb8183dcdcdf735b180f2bf40883e66220/packages/zod/src/v4/core/function.ts#L48
  if ("def" in schema && typeof schema.def === "object" && schema.def) {
    if ((schema.def as { type: string })?.type === "function") {
      return true;
    }
  }

  // We're casting as string here because zod 4.0 types don't include "function"
  // literal in the union for `_zod.def.type`. The optional chaining is because
  // _zod does not exist on zod 4 objects from zod 3.
  return (schema._zod?.def?.type as string) === "function";
}

/**
 * Checks if a schema is a Zod function schema (Zod 3 or Zod 4).
 * @param schema - The schema to check
 * @returns True if the schema is a Zod function schema
 */
export function isZodFunctionSchema(schema: unknown) {
  return isZod3FunctionSchema(schema) || isZod4FunctionSchema(schema);
}

/**
 * Extracts the args schema from a Zod function schema.
 * @param schema - The Zod function schema
 * @returns The args schema, or undefined if not a Zod function schema
 */
export function getZodFunctionArgs(schema: unknown) {
  if (isZod3FunctionSchema(schema)) {
    return schema._def.args;
  }

  if (isZod4FunctionSchema(schema)) {
    // @ts-expect-error -- Error in Zod types for v3 vs v4.0
    return schema?.def?.input ?? schema._zod?.def?.input;
  }

  throw new Error("Unable to determine parameters from zod function schema");
}

/**
 * Extracts the return schema from a Zod 3 or Zod 4 function schema.
 * @param schema - The Zod function schema
 * @returns The return schema, or undefined if not a Zod function schema
 */
export function getZodFunctionReturns(schema: unknown) {
  if (isZod3FunctionSchema(schema)) {
    return schema._def.returns;
  }

  if (isZod4FunctionSchema(schema)) {
    // v4.0.x: output on .def directly
    // v4.1.x: output on ._zod.def
    // @ts-expect-error -- Type differences between v4.0.x and v4.1.x
    return schema.def?.output ?? schema._zod?.def?.output;
  }

  throw new Error("Unable to determine return type from zod function schema");
}

/**
 * Handles conversion of Zod schemas to JSON Schema.
 * Supports both Zod 3 (via zod-to-json-schema) and Zod 4 (native).
 * @param schema - The Zod schema to convert
 * @returns The JSON Schema representation
 */
export function handleZodSchemaToJson(schema: unknown) {
  // If Zod4 schema detected, use the toJSONSchema function from "zod/v4/core"
  if (isZod4Schema(schema)) {
    return zod4ToJSONSchema(schema, { reused: "inline" }) as JSONSchema7;
  }

  try {
    // Dynamic require for optional peer dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- need require because zod-to-json-schema may be missing
    const { zodToJsonSchema } = require("zod-to-json-schema");
    return zodToJsonSchema(schema, { $refStrategy: "none" }) as JSONSchema7;
  } catch (error) {
    throw new Error(
      "Zod 3 requires 'zod-to-json-schema' package for JSON Schema conversion. " +
        "Install it with: npm install zod-to-json-schema",
      {
        cause: error,
      },
    );
  }
}

/**
 * Checks if a schema is probably a Zod 3 schema.
 * @param schema - The schema to check
 * @returns True if the schema looks like a Zod 3 schema
 */
export function isZod3Schema(schema: unknown): schema is ZodType {
  return isZodSchema(schema) && "_def" in schema && !("def" in schema);
}

/**
 * Detects if a schema is Zod 4 by checking for Zod 4 markers.
 * - v4.1.x has `_zod` property
 * - v4.0.x (bundled in zod@3.25) has `def` directly but no `_def` for regular schemas
 * - v4.0.x function schemas have both `_def` and `def` (special case)
 * @returns True if the schema appears to be Zod 4 style
 */
export function isZod4Schema(schema: unknown): schema is $ZodType {
  if (!isZodSchema(schema)) return false;

  // v4.1.x: has _zod property
  if ("_zod" in schema) return true;

  // v4.0.x regular schemas: has def directly but NOT _def (v3 has _def)
  // Also check def.type is a lowercase string (v4 convention)
  if ("def" in schema && !("_def" in schema)) {
    const def = (schema as { def: unknown }).def;
    if (def && typeof def === "object" && "type" in def) {
      return typeof def.type === "string";
    }
  }

  // v4.0.x function schemas: have both _def and def with type "function"
  // This is a special case where _def exists but it's still a v4 schema
  if ("_def" in schema && "def" in schema) {
    const def = (schema as { def: unknown }).def;
    if (def && typeof def === "object" && "type" in def) {
      return def.type === "function";
    }
  }

  return false;
}

/**
 * Checks if a schema is a Zod schema
 * @param schema - The schema to check
 * @returns True if the schema is a Zod schema
 */
export function isZodSchema(schema: unknown): schema is ZodType | $ZodType {
  if (typeof schema !== "object") return false;
  if (!schema) return false;

  // Standard detection: schema has { ~standard: { vendor: "zod" } }
  if ("~standard" in schema && schema["~standard"]) {
    const std = schema["~standard"];
    if (typeof std === "object" && "vendor" in std && std.vendor === "zod") {
      // Require at least one internal marker to reduce false positives
      const looksLikeV3 = "_def" in schema;
      const looksLikeV4 = "_zod" in schema || "def" in schema;
      return looksLikeV3 || looksLikeV4;
    }
  }

  // v4.0.x function schemas: have _def and def with type "function"
  // but don't have ~standard at the top level (only on nested schemas)
  if ("_def" in schema && "def" in schema) {
    const def = (schema as { def: unknown }).def;
    if (
      def &&
      typeof def === "object" &&
      "type" in def &&
      def.type === "function"
    ) {
      // Check if nested input/output have zod markers
      const inputIsZod =
        "input" in def &&
        typeof def.input === "object" &&
        def.input !== null &&
        "~standard" in def.input;

      const outputIsZod =
        "output" in def &&
        typeof def.output === "object" &&
        def.output !== null &&
        "~standard" in def.output;
      return inputIsZod || outputIsZod;
    }
  }

  return false;
}
