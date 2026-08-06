import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { initializeRateLimitConfig } from "./rate-limit.config";
import { RateLimitGuard } from "./rate-limit.guard";

/**
 * Rate limit values read from environment variables. Used by both the
 * global throttler and per-route @Throttle decorators.
 *
 * - `RATE_LIMIT_DEFAULT` (default: 100) — default per-endpoint limit
 * - `RATE_LIMIT_STREAMING` (default: 20) — LLM run and advancestream endpoints
 * - `RATE_LIMIT_STRICT` (default: 10) — OAuth token exchange
 * - `RATE_LIMIT_MCP` (default: 60) — MCP endpoint
 *
 * For production multi-instance deployments, replace the default in-memory
 * storage with `@nestjs/throttler-storage-redis` to share counters across
 * instances.
 */
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rateLimitDefault = initializeRateLimitConfig(configService);

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
