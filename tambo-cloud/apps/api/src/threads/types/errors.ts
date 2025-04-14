import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";

/** The number of free messages allowed before requiring an API key */
export const FREE_MESSAGE_LIMIT = 500;

export interface SuggestionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class SuggestionNotFoundException extends NotFoundException {
  constructor(messageId: string) {
    super({
      code: "SUGGESTION_NOT_FOUND",
      message: `No suggestions found for message ${messageId}`,
    } as SuggestionError);
  }
}

export class SuggestionGenerationError extends HttpException {
  constructor(messageId: string, details?: Record<string, unknown>) {
    super(
      {
        code: "SUGGESTION_GENERATION_FAILED",
        message: `Failed to generate suggestions for message ${messageId}`,
        details,
      } as SuggestionError,
      500,
    );
  }
}

export class InvalidSuggestionRequestError extends HttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      {
        code: "INVALID_SUGGESTION_REQUEST",
        message,
        details,
      } as SuggestionError,
      400,
    );
  }
}

export class FreeLimitReachedError extends HttpException {
  constructor() {
    super(
      {
        message: `You have used all ${FREE_MESSAGE_LIMIT} free messages. To continue using this service, please contact your provider or, if you are the developer, set up your OpenAI API key at https://tambo.co/dashboard.`,
        type: "FREE_LIMIT_REACHED",
        limit: FREE_MESSAGE_LIMIT,
        settingsUrl: "https://tambo.co/dashboard",
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
