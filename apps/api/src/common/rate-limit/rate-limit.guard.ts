import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";
import { hashKey } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { ProblemDetails } from "../../threads/types/errors";

const RATE_LIMIT_PROBLEM_TYPE =
  "https://docs.tambo.co/reference/problems/rate-limit";

/**
 * Custom throttler guard that uses the API key (hashed) as the rate limit
 * identifier when present, falling back to IP address for unauthenticated
 * requests. Returns RFC 9457 Problem Details on 429 and adds standard
 * rate limit headers to all responses.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    options: ConstructorParameters<typeof ThrottlerGuard>[0],
    storageService: ConstructorParameters<typeof ThrottlerGuard>[1],
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected override getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const ctx = context.switchToHttp();
    return {
      req: ctx.getRequest<Request>(),
      res: ctx.getResponse<Response>(),
    };
  }

  /**
   * Returns the rate limit tracker key: hashed API key when present,
   * otherwise the client IP address.
   */
  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const request = req as Request;
    const apiKey = request.headers["x-api-key"];
    const key = Array.isArray(apiKey) ? apiKey[0] : apiKey;

    if (key) {
      return `apikey:${hashKey(key)}`;
    }

    return `ip:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
  }

  /**
   * Sets rate limit headers on every response and returns `true` to allow
   * the request through. Called by the base class on every throttled request.
   */
  protected override async handleRequest(
    requestProps: Parameters<ThrottlerGuard["handleRequest"]>[0],
  ): Promise<boolean> {
    const result = await super.handleRequest(requestProps);
    const { res } = this.getRequestResponse(requestProps.context);
    const response = res as Response;

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
   * Returns a 429 response with RFC 9457 Problem Details body and
   * Retry-After header instead of throwing an exception. This integrates
   * with the existing DomainExceptionFilter and HttpExceptionFilter patterns.
   */
  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req, res } = this.getRequestResponse(context);
    const response = res as Response;
    const request = req as Request;

    if (response.headersSent) {
      return;
    }

    const retryAfterSeconds = Math.ceil(throttlerLimitDetail.ttl / 1000);

    const problemDetails: ProblemDetails = {
      type: RATE_LIMIT_PROBLEM_TYPE,
      status: 429,
      title: "Too Many Requests",
      detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      instance: request.originalUrl ?? request.url,
    };

    response.setHeader("Retry-After", retryAfterSeconds);
    response.setHeader("X-RateLimit-Limit", throttlerLimitDetail.limit);
    response.setHeader("X-RateLimit-Remaining", 0);
    response.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + throttlerLimitDetail.ttl).toISOString(),
    );

    response
      .status(429)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
