import type { TamboElicitationRequest } from "@tambo-ai/react/mcp";

export type FieldSchema =
  TamboElicitationRequest["requestedSchema"]["properties"][string];

/**
 * Unified validation function that returns both validity and a user-facing message.
 * Avoids drift between boolean validation and error computation.
 * @returns An object with `valid` (boolean) and `error` (string or null)
 */
export function validateField(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): { valid: boolean; error: string | null } {
  // Required
  if (required && (value === undefined || value === "" || value === null)) {
    return { valid: false, error: "This field is required" };
  }

  // If empty and not required, it's valid
  if (!required && (value === undefined || value === "" || value === null)) {
    return { valid: true, error: null };
  }

  // String validation
  if (schema.type === "string") {
    const stringSchema = schema;
    const stringValue = String(value);

    if (
      "minLength" in stringSchema &&
      stringSchema.minLength !== undefined &&
      stringValue.length < stringSchema.minLength
    ) {
      return {
        valid: false,
        error: `Minimum length is ${stringSchema.minLength} characters`,
      };
    }

    if (
      "maxLength" in stringSchema &&
      stringSchema.maxLength !== undefined &&
      stringValue.length > stringSchema.maxLength
    ) {
      return {
        valid: false,
        error: `Maximum length is ${stringSchema.maxLength} characters`,
      };
    }

    if ("pattern" in stringSchema && stringSchema.pattern) {
      try {
        const regex = new RegExp(stringSchema.pattern as string);
        if (!regex.test(stringValue)) {
          return {
            valid: false,
            error: "Value does not match required pattern",
          };
        }
      } catch {
        // Invalid regex pattern, skip validation
      }
    }

    // Format validation
    if ("format" in stringSchema && stringSchema.format) {
      switch (stringSchema.format) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
            return {
              valid: false,
              error: "Please enter a valid email address",
            };
          }
          break;
        case "uri":
          try {
            new URL(stringValue);
          } catch {
            return { valid: false, error: "Please enter a valid URL" };
          }
          break;
      }
    }
  }

  // Number validation
  if (schema.type === "number" || schema.type === "integer") {
    const numberSchema = schema;
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return { valid: false, error: "Please enter a valid number" };
    }

    if (
      numberSchema.minimum !== undefined &&
      numberValue < numberSchema.minimum
    ) {
      return {
        valid: false,
        error: `Minimum value is ${numberSchema.minimum}`,
      };
    }

    if (
      numberSchema.maximum !== undefined &&
      numberValue > numberSchema.maximum
    ) {
      return {
        valid: false,
        error: `Maximum value is ${numberSchema.maximum}`,
      };
    }

    if (schema.type === "integer" && !Number.isInteger(numberValue)) {
      return { valid: false, error: "Please enter a whole number" };
    }
  }

  return { valid: true, error: null };
}

/**
 * Backwards-compatible helper that delegates to the unified validator.
 * @returns A validation error message, or null if valid
 */
export function getValidationError(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): string | null {
  return validateField(value, schema, required).error;
}

/**
 * Determines if the elicitation should use single-entry mode
 * (one field that is boolean or enum).
 * @returns true when the request contains exactly one boolean or enum field
 */
export function isSingleEntryMode(request: TamboElicitationRequest): boolean {
  const fields = Object.entries(request.requestedSchema.properties);

  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];

  return (
    schema.type === "boolean" || (schema.type === "string" && "enum" in schema)
  );
}

/**
 * Maps JSON Schema format to HTML5 input type.
 * @returns The appropriate HTML input type string
 */
export function getInputType(schema: FieldSchema & { type: "string" }): string {
  const format = "format" in schema ? schema.format : undefined;
  switch (format) {
    case "email":
      return "email";
    case "uri":
      return "url";
    case "date":
      return "date";
    case "date-time":
      return "datetime-local";
    default:
      return "text";
  }
}
