import {
  CustomLlmParameters,
  JSONValue,
  LlmParameterUIType,
} from "@tambo-ai-cloud/core";
import { ParameterEntry } from "./types";

/**
 * Safely attempts to parse JSON, returning null if parsing fails
 */
const tryParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * Validates if a value is valid for the given parameter type
 */
export const validateValue = (value: string, type: LlmParameterUIType) => {
  if (!value.trim()) return { isValid: false, error: "Value cannot be empty" }; // Empty values are not allowed

  // Handle string type separately since it doesn't need JSON parsing
  if (type === "string") {
    return { isValid: true, error: null };
  }

  // For all other types, try to parse as JSON
  const parsed = tryParseJson(value);

  // Validate the parsed value based on type
  switch (type) {
    case "boolean": {
      const isValid = typeof parsed === "boolean";
      return {
        isValid,
        error: isValid ? null : "Must be 'true' or 'false'",
      };
    }

    case "number": {
      const isValidNumber = typeof parsed === "number" && isFinite(parsed);
      return {
        isValid: isValidNumber,
        error: isValidNumber ? null : "Must be a valid number",
      };
    }

    case "array": {
      const isValidArray = Array.isArray(parsed);
      return {
        isValid: isValidArray,
        error: isValidArray
          ? null
          : "Must be a valid JSON array (e.g., [1, 2, 3])",
      };
    }

    case "object": {
      const isValidObject =
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
      return {
        isValid: isValidObject,
        error: isValidObject
          ? null
          : 'Must be a valid JSON object (e.g., {"key": "value"})',
      };
    }

    default:
      return { isValid: true, error: null };
  }
};

/**
 * Converts string values from form inputs to their proper types for storage.
 * The AI SDK expects proper JSON types, not strings.
 */
export const convertValue = (value: string, type: LlmParameterUIType) => {
  // Handle string type separately
  if (type === "string") {
    return value;
  }

  // Use the validation function to check if the value is valid first
  const validation = validateValue(value, type);
  if (!validation.isValid) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

/**
 * Converts a value to a string for UI display, properly handling objects and arrays
 */
export const valueToString = (value: unknown) => {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

/**
 * Generates a unique ID for parameter entries.
 * Uses timestamp and random number to ensure uniqueness.
 */
export const generateParameterId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random()}`;
};

/**
 * Detects the type of a value from stored JSON.
 * Used when loading parameters from the database.
 */
export const detectType = (value: unknown): LlmParameterUIType => {
  if (Array.isArray(value)) return "array"; // check arrays before objects
  return typeof value as LlmParameterUIType; // for boolean, number, object, string
};

/**
 * Formats a value for display based on its type
 */
export const formatValueForDisplay = (
  value: string,
  type: LlmParameterUIType,
) => {
  // Handle string type separately to add quotes
  if (type === "string") {
    return `"${value}"`;
  }

  // For other types, use JSON.stringify for consistent formatting
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // Fallback to original value if parsing fails
    return value;
  }
};

/**
 * Checks if a value should use a textarea (for arrays and objects)
 */
export const shouldUseTextarea = (type: LlmParameterUIType) => {
  return type === "array" || type === "object";
};

/**
 * Gets the default value for a given parameter type, preferring examples when available
 */
export const getDefaultValueForType = (
  type: LlmParameterUIType,
  example?: JSONValue,
): string => {
  // Use example if provided
  if (example !== undefined) {
    return valueToString(example);
  }

  // Fallback to meaningful examples
  switch (type) {
    case "boolean":
      return "true";
    case "number":
      return "0.7";
    case "array":
      return '["example", "values"]';
    case "object":
      return '{"key": "value"}';
    case "string":
    default:
      return "example";
  }
};

/**
 * Extracts parameters from the nested storage structure (provider -> model -> parameters)
 * and converts them to the UI format for editing
 */
export const extractParameters = (
  customParams: CustomLlmParameters | null | undefined,
  provider?: string | null,
  model?: string | null,
): ParameterEntry[] => {
  if (!provider || !model) return [];

  const modelParams = customParams?.[provider]?.[model] ?? {};

  return Object.entries(modelParams).map(([key, value]) => ({
    id: generateParameterId(key),
    key,
    value: valueToString(value),
    type: detectType(value),
  }));
};
