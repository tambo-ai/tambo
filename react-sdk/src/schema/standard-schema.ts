import { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Type guard to check if an object implements the Standard Schema interface.
 *
 * Standard Schema compliant validators have a `~standard` property containing
 * metadata about the schema including version, vendor, and validate function.
 * Uses duck typing to avoid cross-version Zod compatibility issues.
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
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  if (!("~standard" in obj)) {
    return false;
  }

  const standard = obj["~standard"];
  if (typeof standard !== "object" || standard === null) {
    return false;
  }

  // Check required Standard Schema v1 properties
  return (
    "version" in standard &&
    standard.version === 1 &&
    "vendor" in standard &&
    typeof standard.vendor === "string" &&
    "validate" in standard &&
    typeof standard.validate === "function"
  );
}
