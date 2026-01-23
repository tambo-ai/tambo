/**
 * RFC 9457 Problem Details helper for v1 API error responses.
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */

/**
 * RFC 9457 Problem Details object.
 * Provides a standard way for HTTP APIs to carry machine-readable details of errors.
 */
export interface ProblemDetail {
  /** URI reference identifying the problem type */
  type: string;
  /** Short, human-readable summary of the problem */
  title: string;
  /** HTTP status code */
  status: number;
  /** Human-readable explanation specific to this occurrence */
  detail?: string;
  /** URI reference identifying the specific occurrence */
  instance?: string;
  /** Additional error-specific fields */
  [key: string]: unknown;
}

/**
 * V1 API error codes.
 * These codes are used in the `type` field of Problem Details.
 */
export const V1ErrorCodes = {
  /** A run is already active on this thread */
  CONCURRENT_RUN: "CONCURRENT_RUN",
  /** Cannot perform operation while a run is active */
  RUN_ACTIVE: "RUN_ACTIVE",
  /** The specified run was not found */
  RUN_NOT_FOUND: "RUN_NOT_FOUND",
  /** The specified thread was not found */
  THREAD_NOT_FOUND: "THREAD_NOT_FOUND",
  /** The specified message was not found */
  MESSAGE_NOT_FOUND: "MESSAGE_NOT_FOUND",
  /** The specified component was not found */
  COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND",
  /** Invalid tool call ID provided */
  INVALID_TOOL_CALL: "INVALID_TOOL_CALL",
  /** Invalid or missing tool result */
  INVALID_TOOL_RESULT: "INVALID_TOOL_RESULT",
  /** Invalid previousRunId provided */
  INVALID_PREVIOUS_RUN: "INVALID_PREVIOUS_RUN",
  /** Invalid JSON Patch operations */
  INVALID_JSON_PATCH: "INVALID_JSON_PATCH",
  /** Request validation failed */
  VALIDATION_ERROR: "VALIDATION_ERROR",
  /** Internal server error */
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type V1ErrorCode = (typeof V1ErrorCodes)[keyof typeof V1ErrorCodes];

/**
 * Error code metadata for generating Problem Details.
 */
const errorMetadata: Record<V1ErrorCode, { title: string; status: number }> = {
  [V1ErrorCodes.CONCURRENT_RUN]: {
    title: "Concurrent Run",
    status: 409,
  },
  [V1ErrorCodes.RUN_ACTIVE]: {
    title: "Run Active",
    status: 409,
  },
  [V1ErrorCodes.RUN_NOT_FOUND]: {
    title: "Run Not Found",
    status: 404,
  },
  [V1ErrorCodes.THREAD_NOT_FOUND]: {
    title: "Thread Not Found",
    status: 404,
  },
  [V1ErrorCodes.MESSAGE_NOT_FOUND]: {
    title: "Message Not Found",
    status: 404,
  },
  [V1ErrorCodes.COMPONENT_NOT_FOUND]: {
    title: "Component Not Found",
    status: 404,
  },
  [V1ErrorCodes.INVALID_TOOL_CALL]: {
    title: "Invalid Tool Call",
    status: 400,
  },
  [V1ErrorCodes.INVALID_TOOL_RESULT]: {
    title: "Invalid Tool Result",
    status: 400,
  },
  [V1ErrorCodes.INVALID_PREVIOUS_RUN]: {
    title: "Invalid Previous Run",
    status: 400,
  },
  [V1ErrorCodes.INVALID_JSON_PATCH]: {
    title: "Invalid JSON Patch",
    status: 400,
  },
  [V1ErrorCodes.VALIDATION_ERROR]: {
    title: "Validation Error",
    status: 400,
  },
  [V1ErrorCodes.INTERNAL_ERROR]: {
    title: "Internal Error",
    status: 500,
  },
};

/**
 * Create an RFC 9457 Problem Details object.
 *
 * @param code - The error code from V1ErrorCodes
 * @param detail - Human-readable explanation specific to this occurrence
 * @param extra - Additional fields to include in the response
 * @returns ProblemDetail object ready for HTTP response
 *
 * @example
 * ```typescript
 * throw new HttpException(
 *   createProblemDetail(V1ErrorCodes.CONCURRENT_RUN, "A run is already active on this thread"),
 *   HttpStatus.CONFLICT,
 * );
 * ```
 */
export function createProblemDetail(
  code: V1ErrorCode,
  detail: string,
  extra?: Record<string, unknown>,
): ProblemDetail {
  const metadata = errorMetadata[code];
  const errorId = crypto.randomUUID();

  return {
    type: `urn:tambo:error:${code.toLowerCase()}`,
    title: metadata.title,
    status: metadata.status,
    detail,
    instance: `urn:tambo:error-instance:${errorId}`,
    ...extra,
  };
}

/**
 * Create a validation error Problem Details object with field-level errors.
 *
 * @param errors - Map of field names to error messages
 * @returns ProblemDetail object with validation errors
 *
 * @example
 * ```typescript
 * throw new HttpException(
 *   createValidationProblemDetail({
 *     "message.content": "Content is required",
 *     "message.role": "Role must be 'user'",
 *   }),
 *   HttpStatus.BAD_REQUEST,
 * );
 * ```
 */
export function createValidationProblemDetail(
  errors: Record<string, string>,
): ProblemDetail {
  return createProblemDetail(
    V1ErrorCodes.VALIDATION_ERROR,
    "Request validation failed",
    { errors },
  );
}
