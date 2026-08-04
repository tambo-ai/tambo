import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { decryptApiKey } from "@tambo-ai-cloud/core";
import { Request, Response } from "express";
import { ProblemDetails, RateLimitException } from "../../threads/types/errors";

const RATE_LIMIT_PROBLEM_TYPE =
  "https://docs.tambo.co/reference/problems/rate-limit";

/**
 * Custom throttler guard that uses a cryptographically valid project ID when
 * available before authentication guards run, falling back to source address.
 * Invalid client-supplied credentials cannot create distinct buckets.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
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

  /** Returns a validated project tracker or a source-address fallback. */
  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const request = req as unknown as Request;

    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    const apiKeySecret = this.configService.get<string>("API_KEY_SECRET");
    if (apiKey && apiKeySecret) {
      try {
        const { storedString: projectId } = decryptApiKey(apiKey, apiKeySecret);
        if (projectId) {
          return `project:${projectId}`;
        }
      } catch {
        // Invalid credentials use the source-address bucket.
      }
    }

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
