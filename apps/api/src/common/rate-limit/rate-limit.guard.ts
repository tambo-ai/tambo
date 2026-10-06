import { ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  normalizeIp,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { Request } from "express";
import { ProblemDetails, RateLimitException } from "../../threads/types/errors";

export const RATE_LIMIT_PROBLEM_TYPE =
  "https://docs.tambo.co/reference/problems/rate-limit";

/**
 * Global rate limit guard keyed on the client source address.
 *
 * Address-only keying is deliberate for this pre-authentication layer: the
 * guard runs before route-level auth guards, so no validated project identity
 * exists yet, and trusting an unvalidated credential header would let callers
 * mint fresh buckets per request. Per-project limits keyed on the validated
 * project identity are left for a follow-up.
 *
 * Success-path X-RateLimit-* headers are emitted by the base guard and are
 * intentionally not duplicated here.
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

  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const request = req as unknown as Request;
    const rawIp =
      (typeof request.ip === "string" && request.ip) ||
      request.socket?.remoteAddress ||
      "unknown";
    return `ip:${normalizeIp(rawIp)}`;
  }

  /**
   * Converts a breached limit into an RFC 9457 Problem Details 429.
   *
   * Always throws: returning would let the request fall through to the route
   * handler after the 429 was written.
   */
  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<{
      headersSent: boolean;
      header: (name: string, value: string | number) => void;
      setHeader: (name: string, value: string | number) => void;
    }>();
    const retryAfterSeconds = Math.max(
      1,
      throttlerLimitDetail.timeToBlockExpire > 0
        ? throttlerLimitDetail.timeToBlockExpire
        : throttlerLimitDetail.timeToExpire,
    );
    const problemDetails: ProblemDetails = {
      type: RATE_LIMIT_PROBLEM_TYPE,
      status: HttpStatus.TOO_MANY_REQUESTS,
      title: "Too Many Requests",
      detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      instance: request.originalUrl ?? request.url,
    };
    if (!response.headersSent) {
      this.setResponseHeader(response, "Retry-After", retryAfterSeconds);
      this.setResponseHeader(
        response,
        "X-RateLimit-Limit",
        throttlerLimitDetail.limit,
      );
      this.setResponseHeader(response, "X-RateLimit-Remaining", 0);
      this.setResponseHeader(response, "X-RateLimit-Reset", retryAfterSeconds);
    }
    throw new RateLimitException(problemDetails);
  }
}
