import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";
import { hashKey } from "@tambo-ai-cloud/core";
import { ProjectId } from "../../projects/guards/apikey.guard";
import { Request, Response } from "express";
import { ProblemDetails } from "../../threads/types/errors";

const RATE_LIMIT_PROBLEM_TYPE =
  "https://docs.tambo.co/reference/problems/rate-limit";

/**
 * Custom throttler guard that tracks by authenticated project ID when
 * available (set by ApiKeyGuard/BearerTokenGuard), falling back to
 * a hashed API key, then to client IP. Writes a 429 with RFC 9457
 * Problem Details directly, then throws to prevent handler execution.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const ctx = context.switchToHttp();
    return {
      req: ctx.getRequest<Request>() as unknown as Record<string, unknown>,
      res: ctx.getResponse<Response>() as unknown as Record<string, unknown>,
    };
  }

  /**
   * Returns the rate limit tracker key: authenticated project ID when
   * available, otherwise hashed API key, then client IP.
   */
  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const request = req as unknown as Request;

    // Use authenticated project ID if the auth guard has already run
    const projectId = request[ProjectId];
    if (typeof projectId === "string") {
      return `project:${projectId}`;
    }

    const apiKey = request.headers["x-api-key"];
    const key = Array.isArray(apiKey) ? apiKey[0] : apiKey;

    if (key) {
      return `apikey:${hashKey(key)}`;
    }

    return `ip:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
  }

  /**
   * Sets rate limit headers on every response. Called by the base class
   * on every throttled request that is allowed through.
   */
  protected override async handleRequest(
    requestProps: Parameters<ThrottlerGuard["handleRequest"]>[0],
  ): Promise<boolean> {
    const result = await super.handleRequest(requestProps);
    const { res } = this.getRequestResponse(requestProps.context);
    const response = res as unknown as Response;

    if (response.headersSent) {
      return result;
    }

    response.setHeader("X-RateLimit-Limit", requestProps.limit);
    response.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + requestProps.ttl).toISOString(),
    );

    return result;
  }

  /**
   * Writes a 429 response with RFC 9457 Problem Details body and
   * rate limit headers directly, then throws to prevent the route
   * handler from executing. The response is written before the throw
   * so BaseExceptionFilter sees headersSent and skips its own response.
   */
  protected override throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): never {
    const { res, req } = this.getRequestResponse(context);
    const response = res as unknown as Response;
    const request = req as unknown as Request;

    if (response.headersSent) {
      throw new Error("Rate limit exceeded");
    }

    const retryAfterSeconds = Math.ceil(throttlerLimitDetail.ttl / 1000);

    response.setHeader("Retry-After", retryAfterSeconds);
    response.setHeader("X-RateLimit-Limit", throttlerLimitDetail.limit);
    response.setHeader("X-RateLimit-Remaining", 0);
    response.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + throttlerLimitDetail.ttl).toISOString(),
    );

    const problemDetails: ProblemDetails = {
      type: RATE_LIMIT_PROBLEM_TYPE,
      status: 429,
      title: "Too Many Requests",
      detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      instance: request.originalUrl ?? request.url,
    };

    response
      .status(429)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);

    throw new Error("Rate limit exceeded");
  }
}
