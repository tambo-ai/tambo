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
  if ("def" in schema && typeof schema.def !== "object" && schema.def) {
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
    // @ts-expect-error -- Error in Zod types for v3 vs v4
    return schema._zod.def.output;
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
  if (isZod4Schema(schema))
    return zod4ToJSONSchema(schema, { reused: "inline" });

  try {
    // Dynamic require for optional peer dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- need require because zod-to-json-schema may be missing
    const { zodToJsonSchema } = require("zod-to-json-schema");
    return zodToJsonSchema(schema, { $refStrategy: "none" });
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
 * Detects if a schema is Zod 4 by checking for def.type property.
 * Zod 4 uses `def.type` with lowercase type names like "object", "string".
 * @returns True if the schema appears to be Zod 4 style
 */
export function isZod4Schema(schema: unknown): schema is $ZodType {
  return isZodSchema(schema) && "_zod" in schema;
}

/**
 * Checks if a schema is a Zod schema
 * @param schema - The schema to check
 * @returns True if the schema is a Zod schema
 */
export function isZodSchema(schema: unknown): schema is ZodType | $ZodType {
  // schema must be { ~standard: { vendor: "zod" } }
  if (typeof schema !== "object") return false;
  if (!schema) return false;
  if (!("~standard" in schema)) return false;
  if (!schema["~standard"]) return false;
  if (typeof schema["~standard"] !== "object") return false;
  if (!("vendor" in schema["~standard"])) return false;
  if (schema["~standard"].vendor !== "zod") return false;

  // Require at least one internal marker to reduce false positives
  const looksLikeV3 = "_def" in schema;
  const looksLikeV4 = "_zod" in schema || "def" in schema;
  return looksLikeV3 || looksLikeV4;
}
