export function sanitizeInput(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function validateInput(text: string): {
  isValid: boolean;
  sanitizedInput: string;
  error?: Error;
} {
  const sanitized = sanitizeInput(text);
  if (!sanitized) {
    return { isValid: false, sanitizedInput: sanitized, error: new Error("Message cannot be empty") };
  }
  if (sanitized.length > 4000) {
    return { isValid: false, sanitizedInput: sanitized, error: new Error("Message too long") };
  }
  return { isValid: true, sanitizedInput: sanitized };
}

