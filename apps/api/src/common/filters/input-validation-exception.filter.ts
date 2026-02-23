import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { InputValidationError } from "@tambo-ai-cloud/core";
import { Response } from "express";
import { ProblemDetails } from "../../threads/types/errors";

/**
 * Catches InputValidationError (thrown by service-layer validation) and
 * translates it into a 400 Bad Request with RFC 9457 Problem Details.
 */
@Catch(InputValidationError)
export class InputValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(InputValidationExceptionFilter.name);

  catch(exception: InputValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problemDetails: ProblemDetails = {
      type: "https://problems-registry.smartbear.com/bad-request",
      status: HttpStatus.BAD_REQUEST,
      title: "Bad Request",
      detail: exception.message,
      instance: request.url,
    };

    this.logger.warn(
      `Input validation error: ${exception.message}`,
      exception.stack,
    );

    response
      .status(HttpStatus.BAD_REQUEST)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
