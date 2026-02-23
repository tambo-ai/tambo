import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ServiceError, ServiceErrorKind } from "@tambo-ai-cloud/core";
import { Response } from "express";
import { ProblemDetails } from "../../threads/types/errors";

const STATUS_MAP: Record<ServiceErrorKind, number> = {
  validation: HttpStatus.BAD_REQUEST,
  "not-found": HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  forbidden: HttpStatus.FORBIDDEN,
};

const TITLE_MAP: Record<ServiceErrorKind, string> = {
  validation: "Bad Request",
  "not-found": "Not Found",
  conflict: "Conflict",
  forbidden: "Forbidden",
};

const PROBLEM_TYPE_MAP: Record<ServiceErrorKind, string> = {
  validation: "https://problems-registry.smartbear.com/bad-request",
  "not-found": "https://problems-registry.smartbear.com/not-found",
  conflict: "https://problems-registry.smartbear.com/conflict",
  forbidden: "https://problems-registry.smartbear.com/forbidden",
};

/**
 * Catches ServiceError (and subclasses like InputValidationError, NotFoundError)
 * thrown by service-layer code and translates them into the appropriate HTTP
 * response with RFC 9457 Problem Details.
 */
@Catch(ServiceError)
export class ServiceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ServiceExceptionFilter.name);

  catch(exception: ServiceError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = STATUS_MAP[exception.kind];
    const title = TITLE_MAP[exception.kind];

    const problemDetails: ProblemDetails = {
      type: PROBLEM_TYPE_MAP[exception.kind],
      status,
      title,
      detail: exception.message,
      instance: request.url,
    };

    this.logger.warn(
      `Service error [${exception.kind}]: ${exception.message}`,
      exception.stack,
    );

    response
      .status(status)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
