import { HttpException, NotFoundException } from "@nestjs/common";

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
