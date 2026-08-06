import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { Request, Response } from "express";
import { ProblemDetails, RateLimitException } from "../../threads/types/errors";

const RATE_LIMIT_PROBLEM_TYPE =
  "https://docs.tambo.co/reference/problems/rate-limit";

/**
 * Custom throttler guard that uses the source address before authentication
 * guards run. Project identity is intentionally not inferred from credentials
 * until ApiKeyGuard has validated them.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

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

  /** Returns a tracker that unauthenticated callers cannot rotate per request. */
  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const request = req as unknown as Request;
    return `ip:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
  }

  /**
   * Throws a typed 429 so the existing exception filter preserves status,
   * logging, and Sentry behavior while the content type is retained.
   */
  protected override throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): never {
    const { res, req } = this.getRequestResponse(context);
    const response = res as unknown as Response;
    const request = req as unknown as Request;

    const retryAfterSeconds = Math.max(
      1,
      throttlerLimitDetail.timeToBlockExpire > 0
        ? throttlerLimitDetail.timeToBlockExpire
        : throttlerLimitDetail.timeToExpire,
    );

    const problemDetails: ProblemDetails = {
      type: RATE_LIMIT_PROBLEM_TYPE,
      status: 429,
      title: "Too Many Requests",
      detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      instance: request.originalUrl ?? request.url,
    };

    if (!response.headersSent) {
      response.setHeader("Content-Type", "application/problem+json");
      response.setHeader("Retry-After", retryAfterSeconds);
      response.setHeader("X-RateLimit-Limit", throttlerLimitDetail.limit);
      response.setHeader("X-RateLimit-Remaining", 0);
      response.setHeader("X-RateLimit-Reset", retryAfterSeconds);
    }

    throw new RateLimitException(problemDetails);
  }
}
