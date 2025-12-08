import type { CustomLlmParameters, JSONValue } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Recursive Zod schema for JSONValue type.
 * Validates any JSON-serializable value (string, number, boolean, null, object, array).
 */
export const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(jsonValueSchema),
    z.array(jsonValueSchema),
  ]),
);

/**
 * Zod schema for CustomLlmParameters.
 * Validates a three-level nested object structure:
 * provider -> model -> parameter -> value
 *
 * @example
 * {
 *   "openai": {
 *     "gpt-4.1": {
 *       "temperature": 0.7,
 *       "top_p": 0.9
 *     },
 *     "gpt-4": {
 *       "temperature": 0.5,
 *       "max_tokens": 1000
 *     }
 *   }
 * }
 */
export const customLlmParametersSchema: z.ZodType<CustomLlmParameters> =
  z.record(
    z.string(),
    z.record(z.string(), z.record(z.string(), jsonValueSchema)),
  );
