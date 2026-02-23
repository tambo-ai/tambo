/**
 * Semantic error kinds that service-layer code can throw.
 * The API layer maps these to the appropriate HTTP status codes.
 */
export type DomainErrorKind =
  | "validation"
  | "not-found"
  | "conflict"
  | "forbidden";

/**
 * Base class for service-layer errors that carry a semantic kind.
 * Intentionally has no dependency on HTTP or NestJS — the API layer
 * is responsible for catching it and translating to the appropriate HTTP status.
 */
export class DomainError extends Error {
  constructor(
    public readonly kind: DomainErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/** Caller-provided input fails validation (maps to 400). */
export class InputValidationError extends DomainError {
  constructor(message: string) {
    super("validation", message);
    this.name = "InputValidationError";
  }
}

/** A requested resource was not found (maps to 404). */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super("not-found", message);
    this.name = "NotFoundError";
  }
}
