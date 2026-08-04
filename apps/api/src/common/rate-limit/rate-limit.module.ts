import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigServiceSingleton } from "../../config.service";
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
 * Rate limit values read from environment variables. Used by both the
 * global throttler and per-route @Throttle decorators.
 *
 * - `RATE_LIMIT_DEFAULT` (default: 100) — global per-minute limit
 * - `RATE_LIMIT_STREAMING` (default: 20) — LLM run and advancestream endpoints
 * - `RATE_LIMIT_STRICT` (default: 10) — OAuth token exchange
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
      useFactory: (configService: ConfigService) => {
        const rateLimitDefault = parseRateLimitEnv(
          configService,
          "RATE_LIMIT_DEFAULT",
          100,
        );

        return {
          throttlers: [
            {
              name: "default",
              limit: rateLimitDefault,
              ttl: 60_000,
            },
          ],
          setHeaders: true,
        };
      },
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

/** Per-minute limit for streaming endpoints (LLM runs, advancestream). */
export function getRateLimitStreaming(): number {
  return parseRateLimitEnv(
    ConfigServiceSingleton.getInstance(),
    "RATE_LIMIT_STREAMING",
    20,
  );
}

/** Per-minute limit for strict endpoints (OAuth token exchange). */
export function getRateLimitStrict(): number {
  return parseRateLimitEnv(
    ConfigServiceSingleton.getInstance(),
    "RATE_LIMIT_STRICT",
    10,
  );
}
