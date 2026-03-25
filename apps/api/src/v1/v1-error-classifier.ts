import { APICallError } from "@ai-sdk/provider";
import { HttpException } from "@nestjs/common";

/**
 * Classified error with category and retryability information.
 * Used to emit structured RUN_ERROR events in SSE streams.
 */
export interface ClassifiedError {
  /** Error code identifying the type of error */
  code: string;
  /** Whether this is the client's fault or a server/provider issue */
  category: "client_error" | "server_error";
  /** Safe, client-facing error message */
  message: string;
  /** Whether retrying the request is likely to succeed */
  isRetryable: boolean;
}

/**
 * Classify a streaming error into a structured error with category and retryability.
 *
 * Priority order:
 * 1. AI SDK APICallError — inspects statusCode from the upstream provider
 * 2. NestJS HttpException — maps HTTP status to category
 * 3. Default fallback — treated as internal server error
 *
 * @param error - The caught error from the streaming pipeline
 * @returns Classified error safe for client consumption
 */
export function classifyStreamingError(error: unknown): ClassifiedError {
  // 1. AI SDK APICallError (errors from OpenAI, Anthropic, etc.)
  if (APICallError.isInstance(error)) {
    return classifyApiCallError(error);
  }

  // 2. NestJS HttpException (Tambo's own HTTP errors that leaked through)
  if (error instanceof HttpException) {
    return classifyHttpException(error);
  }

  // 3. Default fallback
  return {
    code: "INTERNAL_ERROR",
    category: "server_error",
    message: "An internal error occurred",
    isRetryable: false,
  };
}

function classifyApiCallError(error: APICallError): ClassifiedError {
  const statusCode = error.statusCode;

  if (statusCode === undefined) {
    return {
      code: "UPSTREAM_ERROR",
      category: "server_error",
      message: "An error occurred communicating with the AI provider",
      isRetryable: false,
    };
  }

  // 429 Rate limit — client's fault but retryable after backoff
  if (statusCode === 429) {
    return {
      code: "UPSTREAM_CLIENT_ERROR",
      category: "client_error",
      message: error.message,
      isRetryable: true,
    };
  }

  // 400-499: client error from the upstream provider
  if (statusCode >= 400 && statusCode < 500) {
    return {
      code: "UPSTREAM_CLIENT_ERROR",
      category: "client_error",
      message: error.message,
      isRetryable: false,
    };
  }

  // 500-599: server error from the upstream provider
  if (statusCode >= 500 && statusCode < 600) {
    return {
      code: "UPSTREAM_SERVER_ERROR",
      category: "server_error",
      message: "The AI provider encountered a temporary error",
      isRetryable: true,
    };
  }

  // Unexpected status code
  return {
    code: "UPSTREAM_ERROR",
    category: "server_error",
    message: "An error occurred communicating with the AI provider",
    isRetryable: false,
  };
}

function extractMessageFromResponse(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === "string") {
    return response;
  }
  if (
    typeof response === "object" &&
    response !== null &&
    "detail" in response &&
    typeof (response as Record<string, unknown>).detail === "string"
  ) {
    return (response as Record<string, unknown>).detail as string;
  }
  return error.message;
}

function extractCodeFromResponse(response: string | object): string {
  if (
    typeof response === "object" &&
    response !== null &&
    "type" in response &&
    typeof (response as Record<string, unknown>).type === "string"
  ) {
    return extractCodeFromType(
      (response as Record<string, unknown>).type as string,
    );
  }
  return "CLIENT_ERROR";
}

function classifyHttpException(error: HttpException): ClassifiedError {
  const status = error.getStatus();
  const response = error.getResponse();
  const message = extractMessageFromResponse(error);

  if (status >= 400 && status < 500) {
    return {
      code: extractCodeFromResponse(response),
      category: "client_error",
      message,
      isRetryable: false,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    category: "server_error",
    message: "An internal error occurred",
    isRetryable: false,
  };
}

/**
 * Extract error code from a URN-style type field.
 * e.g. "urn:tambo:error:concurrent_run" → "CONCURRENT_RUN"
 */
function extractCodeFromType(type: string): string {
  const parts = type.split(":");
  const lastPart = parts.at(-1);
  if (lastPart) {
    return lastPart.toUpperCase();
  }
  return "CLIENT_ERROR";
}
