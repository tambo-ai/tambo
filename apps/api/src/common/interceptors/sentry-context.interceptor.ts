import { CallHandler, ExecutionContext, Injectable } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { Request } from "express";
import { ProjectId } from "../../projects/guards/apikey.guard";
import { ContextKey } from "../../projects/guards/bearer-token.guard";

/**
 * Interceptor that enriches Sentry scope with request context.
 * Runs after guards, so project_id and context_key are available.
 *
 * Note: We don't explicitly implement NestInterceptor due to rxjs version
 * conflicts between packages. The interface is still satisfied at runtime.
 */
@Injectable()
export class SentryContextInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract context set by guards and middleware
    const projectId = request[ProjectId];
    const contextKey = request[ContextKey];
    const correlationId = (request as unknown as Record<string, unknown>)[
      "correlationId"
    ] as string | undefined;
    // Routes use :id, :threadId, or :thread_id depending on the endpoint
    // Only treat :id as threadId if we're on a thread route
    const isThreadRoute = request.path?.includes("/threads/");
    const threadId =
      request.params?.threadId ??
      request.params?.thread_id ??
      (isThreadRoute ? request.params?.id : undefined);

    // Enrich Sentry scope with tags for filtering
    if (projectId) {
      Sentry.setTag("project_id", projectId);
    }
    if (threadId) {
      Sentry.setTag("thread_id", threadId);
    }
    if (contextKey) {
      Sentry.setTag("context_key", contextKey);
    }
    if (correlationId) {
      Sentry.setTag("correlation_id", correlationId);
    }

    // Set structured context for detailed view
    Sentry.setContext("tambo", {
      projectId,
      threadId,
      contextKey,
      correlationId,
    });

    return next.handle();
  }
}
