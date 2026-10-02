import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import {
  RATE_LIMIT_WINDOW_MS,
  isRateLimitEnabled,
  resolveRateLimitDefault,
} from "./rate-limit.config";
import { RateLimitGuard } from "./rate-limit.guard";

/**
 * Registers request rate limiting for the API.
 *
 * A single `default` throttler applies per endpoint (the storage key
 * includes the controller and handler name), keyed per client source
 * address, with a 60-second TTL: each hit expires on its own, and once an
 * endpoint's budget is spent its bucket stays blocked until the window
 * resets. The budget is tuned with RATE_LIMIT_DEFAULT (default 100).
 *
 * The limiter is opt-in: requests pass through untouched unless
 * RATE_LIMIT_ENABLED is "true", so a misconfigured deployment can never
 * throttle all tenants at once. Proxy trust is never assumed either —
 * Express trusts only the TRUST_PROXY hop count (default: none), so a
 * missing value degrades to the directly-connected address instead of
 * attacker-controlled headers. Counters are in-memory and therefore
 * per-process (each replica enforces its own budget).
 */
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const enabled = isRateLimitEnabled(configService);
        return {
          throttlers: [
            {
              name: "default",
              limit: resolveRateLimitDefault(configService),
              ttl: RATE_LIMIT_WINDOW_MS,
            },
          ],
          skipIf: () => !enabled,
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
