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
 * Global rate limit applied to all endpoints.
 *
 * Individual routes override this via @Throttle({ limit: X, ttl: 60000 })
 * to set their own per-route limits. Since only one throttler is registered,
 * there is no additive evaluation — each route is checked against exactly
 * one limit.
 *
 * Configurable via:
 * - RATE_LIMIT_DEFAULT (default: 100) — global per-minute limit
 * - RATE_LIMIT_STREAMING (default: 20) — used by streaming route decorators
 * - RATE_LIMIT_STRICT (default: 10) — used by OAuth route decorator
 *
 * For production multi-instance deployments, replace the default in-memory
 * storage with `@nestjs/throttler-storage-redis` to share counters across
 * instances.
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
