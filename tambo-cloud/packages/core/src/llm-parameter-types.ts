/**
 * Represents any valid JSON value.
 * This recursive type can represent any value that can be serialized to JSON.
 *
 * Used specifically for custom LLM parameters that allow provider-specific configuration.
 * The structure follows: `Record<providerName, Record<parameterName, JSONValue>>`
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

/**
 * Type for custom LLM parameters organized by provider and model.
 * Maps provider names (e.g., "openai", "anthropic") to model-specific parameter configurations.
 * Each provider contains model names that map to their specific parameter configurations.
 * Each model's parameters are key-value pairs where values can be any JSON-serializable data.
 *
 * @example
 * ```typescript
 * const params: CustomLlmParameters = {
 *   "openai": {
 *     "gpt-4.1": {
 *       "temperature": 0.7,
 *       "top_p": 0.9,
 *       "frequency_penalty": 0.1
 *     },
 *     "gpt-4": {
 *       "temperature": 0.5,
 *       "max_tokens": 1000
 *     }
 *   },
 *   "anthropic": {
 *     "claude-3-sonnet": {
 *       "temperature": 0.8,
 *       "top_k": 250
 *     }
 *   }
 * };
 * ```
 */
export type CustomLlmParameters = Record<
  string,
  Record<string, Record<string, JSONValue>>
>;
