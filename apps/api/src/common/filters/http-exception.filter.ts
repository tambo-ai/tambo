import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ProblemDetails } from "../../threads/types/errors";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Get the original response from the exception
    const exceptionResponse = exception.getResponse();

    // If the exception already returns a ProblemDetails object, use it
    if (this.isProblemDetails(exceptionResponse)) {
      response
        .status(status)
        .header("Content-Type", "application/problem+json")
        .json(exceptionResponse);
      return;
    }

    // Create a Problem Details object
    const problemDetails: ProblemDetails = {
      type: this.getProblemType(status),
      status,
      title: this.getTitle(status),
      detail:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      instance: request.url,
    };

    // Add validation errors if present
    if ((exceptionResponse as any).errors) {
      problemDetails.errors = (exceptionResponse as any).errors.map(
        (error: any) => ({
          detail: error.message,
          pointer: error.property,
        }),
      );
    }

    // Log the error
    this.logger.error(
      `HTTP Exception: ${status} ${problemDetails.title} - ${problemDetails.detail}`,
      exception.stack,
    );

    // Send the response
    response
      .status(status)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }

  private isProblemDetails(obj: unknown): obj is ProblemDetails {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "type" in obj &&
      "status" in obj &&
      "title" in obj &&
      "detail" in obj
    );
  }

  private getProblemType(status: number): string {
    const baseUrl = "https://problems-registry.smartbear.com";
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return `${baseUrl}/bad-request`;
      case HttpStatus.UNAUTHORIZED:
        return `${baseUrl}/unauthorized`;
      case HttpStatus.FORBIDDEN:
        return `${baseUrl}/forbidden`;
      case HttpStatus.NOT_FOUND:
        return `${baseUrl}/not-found`;
      case HttpStatus.CONFLICT:
        return `${baseUrl}/conflict`;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return `${baseUrl}/validation-error`;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return `${baseUrl}/internal-server-error`;
      default:
        return `${baseUrl}/api-error`;
    }
  }

  private getTitle(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "Bad Request";
      case HttpStatus.UNAUTHORIZED:
        return "Unauthorized";
      case HttpStatus.FORBIDDEN:
        return "Forbidden";
      case HttpStatus.NOT_FOUND:
        return "Not Found";
      case HttpStatus.CONFLICT:
        return "Conflict";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "Validation Error";
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return "Internal Server Error";
      default:
        return "API Error";
    }
  }
}
