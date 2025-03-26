export interface ValidationResult {
  isValid: boolean;
  error?: Error;
  sanitizedInput: string;
}

/**
 * Validates the input of a message. Makes sure the message is not empty and is not too long.
 * @param input - The input to validate
 * @returns The validation result
 */
export function validateInput(input: string): ValidationResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: new Error("Message cannot be empty"),
      sanitizedInput: trimmed,
    };
  }

  // TODO(perf): Make this configurable if needed
  if (trimmed.length > 10000) {
    return {
      isValid: false,
      error: new Error("Message is too long (max 10000 characters)"),
      sanitizedInput: trimmed,
    };
  }

  return {
    isValid: true,
    sanitizedInput: trimmed,
  };
}
