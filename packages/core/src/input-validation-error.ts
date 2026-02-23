/**
 * Thrown by service-layer code when caller-provided input fails validation.
 * This class intentionally has no dependency on HTTP or NestJS — the API layer
 * is responsible for catching it and translating to the appropriate HTTP status.
 */
export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}
