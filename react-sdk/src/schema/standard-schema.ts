import { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod/v4";

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
