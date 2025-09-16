import type { CustomLlmParameters, JSONValue } from "@tambo-ai-cloud/core";
import { z } from "zod";

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

// Common parameter suggestions based on provider
// These parameters are passed directly to the provider's API as providerOptions
// See: https://ai-sdk.dev/providers/openai-compatible-providers#provider-specific-options
export const PARAMETER_SUGGESTIONS: Record<
  string,
  Array<{ key: string; description: string; type: string }>
> = {
  openai: [
    {
      key: "temperature",
      description: "Controls randomness (0-2)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "frequency_penalty",
      description: "Penalty for repetition (-2 to 2)",
      type: "number",
    },
    {
      key: "presence_penalty",
      description: "Penalty for new topics (-2 to 2)",
      type: "number",
    },
    { key: "seed", description: "Deterministic sampling seed", type: "number" },
    {
      key: "logprobs",
      description: "Include log probabilities",
      type: "boolean",
    },
    {
      key: "top_logprobs",
      description: "Number of log probabilities",
      type: "number",
    },
  ],
  anthropic: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    { key: "top_k", description: "Top K sampling", type: "number" },
  ],
  mistral: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "safe_prompt",
      description: "Enable safety prompt",
      type: "boolean",
    },
  ],
  groq: [
    {
      key: "temperature",
      description: "Controls randomness (0-2)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
  ],
  gemini: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "topP", description: "Nucleus sampling threshold", type: "number" },
    { key: "topK", description: "Top K sampling", type: "number" },
  ],
  "openai-compatible": [
    { key: "temperature", description: "Controls randomness", type: "number" },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "frequency_penalty",
      description: "Penalty for repetition",
      type: "number",
    },
    {
      key: "presence_penalty",
      description: "Penalty for new topics",
      type: "number",
    },
    { key: "seed", description: "Deterministic sampling seed", type: "number" },
    {
      key: "max_tokens",
      description: "Maximum tokens to generate",
      type: "number",
    },
    // OpenAI-compatible providers may support various custom parameters
  ],
};
