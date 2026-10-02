import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import {
  RATE_LIMIT_WINDOW_MS,
  resolveRateLimitDefault,
} from "./rate-limit.config";
import { RateLimitGuard } from "./rate-limit.guard";

/**
 * Registers request rate limiting for the API.
 *
 * A single `default` throttler applies per endpoint (the storage key includes
 * the controller and handler name), keyed per client source address, over a
 * fixed 60s window. Limits are tuned with RATE_LIMIT_DEFAULT (default 100).
 *
 * Known limitations, intentionally left for follow-ups rather than fixed
 * here: counters are in-memory and therefore per-process (each replica
 * enforces its own budget), and Express does not trust proxy headers, so
 * deployments behind a reverse proxy share one bucket per endpoint for all
 * unauthenticated traffic.
 */
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: "default",
            limit: resolveRateLimitDefault(configService),
            ttl: RATE_LIMIT_WINDOW_MS,
          },
        ],
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
