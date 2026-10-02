import { ConfigService } from "@nestjs/config";

/** Default requests allowed per window, per endpoint, per client. */
export const RATE_LIMIT_DEFAULT = 100;

/** Length of the fixed rate limit window in milliseconds. */
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Upper bound accepted for any configured limit. */
export const RATE_LIMIT_MAX = 100_000;

/**
 * Reads a rate limit from configuration, falling back when unset.
 *
 * Only plain decimal integers in the range 1..RATE_LIMIT_MAX are accepted,
 * so values like "20.5", "0x64", or "1e9" fail fast instead of silently
 * changing the enforced limit.
 *
 * @returns The parsed limit, or the fallback when the key is unset or empty.
 */
export function parseRateLimitEnv(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = configService.get<string>(key);
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const normalized = raw.trim();
  const isDecimalInteger = normalized
    .split("")
    .every((character) => character >= "0" && character <= "9");
  const parsed = Number(normalized);
  if (
    !isDecimalInteger ||
    !Number.isSafeInteger(parsed) ||
    parsed < 1 ||
    parsed > RATE_LIMIT_MAX
  ) {
    throw new Error(
      `Invalid ${key}="${raw}": must be a decimal integer between 1 and ${RATE_LIMIT_MAX}.`,
    );
  }
  return parsed;
}

/**
 * Resolves the default per-endpoint rate limit for this process.
 *
 * @returns The value of RATE_LIMIT_DEFAULT, or 100 when unset.
 */
export function resolveRateLimitDefault(configService: ConfigService): number {
  return parseRateLimitEnv(
    configService,
    "RATE_LIMIT_DEFAULT",
    RATE_LIMIT_DEFAULT,
  );
}
