import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { RateLimitException } from "../../threads/types/errors";

/**
 * Catches RateLimitException and formats the response as RFC 9457 Problem Details.
 * Ensures the Content-Type header remains application/problem+json.
 */
@Catch(RateLimitException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  catch(exception: RateLimitException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const problemDetails = exception.getResponse();

    if (response.headersSent) {
      return;
    }

    response
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
