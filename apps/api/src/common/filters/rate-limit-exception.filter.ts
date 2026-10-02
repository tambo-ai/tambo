import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { RateLimitException } from "../../threads/types/errors";

/**
 * Renders RateLimitException as an RFC 9457 Problem Details 429.
 *
 * Scoped to RateLimitException only, so the API-wide error contract is
 * unchanged. 429s are routine traffic signals: they log at warn and never
 * reach Sentry (capture is gated on status >= 500).
 */
@Catch(RateLimitException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RateLimitExceptionFilter.name);

  catch(exception: RateLimitException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const problemDetails = exception.getResponse();
    this.logger.warn(`Rate limit exceeded: ${JSON.stringify(problemDetails)}`);
    if (response.headersSent) {
      return;
    }
    response
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
