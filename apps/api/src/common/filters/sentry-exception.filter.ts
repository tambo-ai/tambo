import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";
import { Request } from "express";

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    // Determine the status code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (
      typeof exception?.statusCode === "number" &&
      typeof exception?.message === "string"
    ) {
      status = exception.statusCode;
    }

    // Extract error details
    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    const errorMessage =
      typeof errorResponse === "string"
        ? errorResponse
        : (errorResponse as any).message ||
          exception.message ||
          "Unknown error";

    // Capture exception in Sentry with additional context
    if (status >= 500) {
      // Only send server errors to Sentry
      Sentry.withScope((scope) => {
        // Add request context
        scope.setContext("request", {
          method: request.method,
          url: request.url,
          headers: request.headers,
          query: request.query,
          params: request.params,
          body: request.body,
        });

        // DO NOT set custom fingerprints - let Sentry's automatic grouping handle it
        // Sentry's algorithm analyzes stack traces, error types, and uses AI to
        // create better groupings than simple route-based fingerprinting.
        // See: https://docs.sentry.io/concepts/data-management/event-grouping/

        // Add tags for filtering/searching in Sentry UI (doesn't affect grouping)
        scope.setTag("http.method", request.method);
        scope.setTag("http.status_code", status);
        scope.setTag("http.route", request.route?.path || "unknown");

        // Add user context if available (helps track affected users)
        if ((request as any).user) {
          scope.setUser({
            id: (request as any).user.id,
            email: (request as any).user.email,
          });
        }

        // Only set custom fingerprints for specific known edge cases
        // Example: External service connection errors that should be grouped together
        if (exception.code === "ECONNREFUSED" && exception.port) {
          scope.setFingerprint(["connection-refused", String(exception.port)]);
        } else if (exception.code === "ETIMEDOUT" && exception.hostname) {
          scope.setFingerprint(["connection-timeout", exception.hostname]);
        }
        // For all other errors, let Sentry's automatic fingerprinting handle it

        // Capture the exception
        Sentry.captureException(exception);
      });
    }

    const logMessage = `[${request.method}] ${request.url} - Status: ${status} - ${errorMessage}`;

    // Log locally as well
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.debug(logMessage);
    }

    // let the default exception filter handle the response
    super.catch(exception, host);
  }
}
