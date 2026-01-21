import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";

/** The number of free messages allowed before requiring an API key */
export const FREE_MESSAGE_LIMIT = 500;

/** Interface definition for RFC9457: JSON Problem Details */
export interface ProblemDetails {
  type: string;
  status?: number;
  title?: string;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Array<{
    detail: string;
    pointer?: string;
  }>;
  details?: Record<string, unknown>;
}

export class EndpointDeprecatedException extends HttpException {
  constructor({
    detail,
    instance,
    migrateToEndpoint,
  }: {
    detail: string;
    instance?: string;
    migrateToEndpoint: string;
  }) {
    super(
      {
        type: "https://docs.tambo.co/api-reference/problems/endpoint-deprecated",
        status: HttpStatus.GONE,
        title: "Endpoint Deprecated",
        detail,
        code: "ENDPOINT_DEPRECATED",
        instance,
        details: {
          migrateToEndpoint,
        },
      } satisfies ProblemDetails,
      HttpStatus.GONE,
    );
  }
}

export class SuggestionNotFoundException extends NotFoundException {
  constructor(messageId: string) {
    super({
      type: "https://problems-registry.smartbear.com/not-found",
      status: HttpStatus.NOT_FOUND,
      title: "Suggestion Not Found",
      detail: `No suggestions found for message ${messageId}`,
      code: "SUGGESTION_NOT_FOUND",
    } satisfies ProblemDetails);
  }
}

export class SuggestionGenerationError extends HttpException {
  constructor(messageId: string, details?: Record<string, unknown>) {
    super(
      {
        type: "https://problems-registry.smartbear.com/internal-server-error",
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        title: "Suggestion Generation Failed",
        detail: `Failed to generate suggestions for message ${messageId}`,
        code: "SUGGESTION_GENERATION_FAILED",
        details,
      } satisfies ProblemDetails,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class InvalidSuggestionRequestError extends HttpException {
  constructor(detail: string, details?: Record<string, unknown>) {
    super(
      {
        type: "https://problems-registry.smartbear.com/bad-request",
        status: HttpStatus.BAD_REQUEST,
        title: "Invalid Suggestion Request",
        detail,
        code: "INVALID_SUGGESTION_REQUEST",
        details,
      } satisfies ProblemDetails,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class FreeLimitReachedError extends HttpException {
  constructor() {
    super(
      {
        type: "https://problems-registry.smartbear.com/payment-required",
        status: HttpStatus.PAYMENT_REQUIRED,
        title: "Starter LLM Call Limit Reached",
        detail: `You’ve used all ${FREE_MESSAGE_LIMIT} starter LLM calls. To continue, add your LLM provider key at https://tambo.co/dashboard.`,
        code: "FREE_LIMIT_REACHED",
        details: {
          limit: FREE_MESSAGE_LIMIT,
          settingsUrl: "https://tambo.co/dashboard",
        },
      } satisfies ProblemDetails,
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
