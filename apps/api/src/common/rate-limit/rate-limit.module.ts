import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { RateLimitGuard } from "./rate-limit.guard";

function parseRateLimitEnv(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = configService.get<string>(key);
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key}="${raw}": must be a positive number.`);
  }
  return parsed;
}

/**
 * Named throttle tiers for different endpoint groups.
 *
 * - `default`: Standard API endpoints (100 requests per 60 seconds)
 * - `streaming`: SSE streaming endpoints that invoke LLM runs (20 requests per 60 seconds)
 * - `strict`: Security-sensitive endpoints like OAuth token exchange (10 requests per 60 seconds)
 *
 * Limits are configurable via environment variables:
 * - RATE_LIMIT_DEFAULT (default: 100)
 * - RATE_LIMIT_STREAMING (default: 20)
 * - RATE_LIMIT_STRICT (default: 10)
 *
 * For production multi-instance deployments, replace the default in-memory storage
 * with `@nestjs/throttler-storage-redis` to share rate limit counters across instances.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: "default",
            limit: parseRateLimitEnv(configService, "RATE_LIMIT_DEFAULT", 100),
            ttl: 60_000,
          },
          {
            name: "streaming",
            limit: parseRateLimitEnv(configService, "RATE_LIMIT_STREAMING", 20),
            ttl: 60_000,
          },
          {
            name: "strict",
            limit: parseRateLimitEnv(configService, "RATE_LIMIT_STRICT", 10),
            ttl: 60_000,
          },
        ],
        setHeaders: true,
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class RateLimitModule {}
