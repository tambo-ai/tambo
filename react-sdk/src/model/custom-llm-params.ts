/**
 * Types and utilities for handling custom LLM parameters
 * Supports merging default, project-level, and request-level parameters
 * with proper precedence and validation
 */

/**
 * Custom LLM parameters that can be passed to the model provider
 * Kept permissive to allow any provider-specific parameters
 */
export type CustomLlmParams = Record<string, unknown>;

/**
 * Standard model parameters that are handled directly by the AI SDK
 * These are extracted from custom params and passed as normal model options
 */
export interface StandardModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  top_k?: number;
  repetition_penalty?: number;
  min_p?: number;
  seed?: number;
}

/**
 * Parameters for merging custom LLM parameters with proper precedence
 */
export interface MergeModelParamsInput {
  /** Default parameters set by Tambo */
  defaults?: CustomLlmParams;
  /** Project-level custom parameters */
  projectParams?: CustomLlmParams;
  /** Request-level parameter overrides */
  requestOverrides?: CustomLlmParams;
}

/**
 * Result of merging custom parameters
 */
export interface MergedModelParams {
  /** Standard parameters to pass as model options */
  standardParams: StandardModelParams;
  /** Provider-specific parameters to pass via providerOptions */
  providerOptions: CustomLlmParams;
}

/**
 * Keys that are reserved and cannot be overridden by custom parameters
 * These are critical for Tambo's functionality and routing
 */
export const RESERVED_PARAM_KEYS = new Set([
  "model",
  "messages",
  "tools",
  "tool_choice",
  "stream",
  "response_format",
  "user",
  "logit_bias",
  "logprobs",
  "top_logprobs",
  "n",
  "stop",
  "suffix",
  "echo",
  "best_of",
  "completion_config",
  "prompt",
  "max_completion_tokens",
]);

/**
 * Standard parameter keys that should be extracted and passed as model options
 */
export const STANDARD_PARAM_KEYS = new Set([
  "temperature",
  "top_p",
  "max_tokens",
  "frequency_penalty",
  "presence_penalty",
  "top_k",
  "repetition_penalty",
  "min_p",
  "seed",
]);

/**
 * Deep merge utility for objects with last-in-wins precedence
 * Handles nested objects properly while preserving type safety
 * @param target - The target object (lower precedence)
 * @param source - The source object (higher precedence)
 * @returns The merged object
 */
function deepMerge(
  target: CustomLlmParams,
  source: CustomLlmParams,
): CustomLlmParams {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    // Always include the value, even if null or undefined
    // Some providers may use these values meaningfully
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key]) &&
      result[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as CustomLlmParams,
        value as CustomLlmParams,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Filters out reserved keys that cannot be overridden
 * Logs warnings for any reserved keys that were attempted to be set
 * @param params - The custom parameters to filter
 * @returns The filtered parameters with reserved keys removed
 */
function filterReservedKeys(params: CustomLlmParams): CustomLlmParams {
  const filtered: CustomLlmParams = {};

  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_PARAM_KEYS.has(key)) {
      console.warn(`Custom parameter '${key}' is reserved and will be ignored`);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Separates merged parameters into standard model params and provider options
 * @param mergedParams - The merged custom parameters
 * @returns Object containing separated standard params and provider options
 */
function separateParams(mergedParams: CustomLlmParams): MergedModelParams {
  const standardParams: StandardModelParams = {};
  const providerOptions: CustomLlmParams = {};

  for (const [key, value] of Object.entries(mergedParams)) {
    if (STANDARD_PARAM_KEYS.has(key)) {
      (standardParams as any)[key] = value;
    } else {
      providerOptions[key] = value;
    }
  }

  return { standardParams, providerOptions };
}

/**
 * Merges custom LLM parameters with proper precedence:
 * defaults < projectParams < requestOverrides
 *
 * Features:
 * - Deep merge for nested objects
 * - Validates against reserved keys
 * - Filters out reserved/locked keys
 * - Separates standard params from provider-specific options
 * @param input - Object containing default, project, and request parameters
 * @returns Merged parameters split into standard params and provider options
 */
export function mergeModelParams(
  input: MergeModelParamsInput,
): MergedModelParams {
  const { defaults = {}, projectParams = {}, requestOverrides = {} } = input;

  // Start with defaults
  let merged = { ...defaults };

  // Deep merge project params (overrides defaults)
  if (Object.keys(projectParams).length > 0) {
    merged = deepMerge(merged, projectParams);
  }

  // Deep merge request overrides (highest precedence)
  if (Object.keys(requestOverrides).length > 0) {
    merged = deepMerge(merged, requestOverrides);
  }

  // Filter out reserved keys
  const filtered = filterReservedKeys(merged);

  // Separate into standard params and provider options
  return separateParams(filtered);
}

/**
 * Validates that custom parameters don't contain any reserved keys
 * Useful for validation before storing project-level parameters
 * @param params - The custom parameters to validate
 * @returns Object containing validation result and any error messages
 */
export function validateCustomParams(params: CustomLlmParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const key of Object.keys(params)) {
    if (RESERVED_PARAM_KEYS.has(key)) {
      errors.push(`Parameter '${key}' is reserved and cannot be customized`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
