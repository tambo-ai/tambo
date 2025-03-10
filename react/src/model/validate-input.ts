export interface ValidationResult {
  isValid: boolean;
  error?: Error;
  sanitizedInput: string;
}

// TODO(future): Consider adding more validation rules if needed
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
