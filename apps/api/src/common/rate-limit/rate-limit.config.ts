import { ConfigService } from "@nestjs/config";

/** Default requests allowed per window, per endpoint, per client. */
export const RATE_LIMIT_DEFAULT = 100;

/**
 * Time-to-live for each recorded hit in milliseconds. Once an endpoint's
 * budget is spent, its bucket stays blocked until the window resets.
 */
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

/**
 * Reports whether request rate limiting is enforced.
 *
 * The limiter ships disabled: only an explicit `RATE_LIMIT_ENABLED=true`
 * turns enforcement on. Anything else unparsable fails fast so a typo can
 * never silently change enforcement.
 *
 * @returns True only when RATE_LIMIT_ENABLED is "true".
 */
export function isRateLimitEnabled(configService: ConfigService): boolean {
  const raw = configService.get<string>("RATE_LIMIT_ENABLED");
  if (raw === undefined || raw.trim() === "") {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "false") {
    return normalized === "true";
  }
  throw new Error(
    `Invalid RATE_LIMIT_ENABLED="${raw}": must be "true" or "false".`,
  );
}

/**
 * Resolves how many proxy hops Express may trust for client addresses.
 *
 * Unset, empty, or "false" means no hops are trusted, so the client address
 * is always the directly-connected peer and `X-Forwarded-For` is ignored —
 * the only spoof-proof setting when the API is exposed directly. A plain
 * decimal integer trusts exactly that many hops and is required when
 * running behind a reverse proxy or ingress. The value "true" is rejected:
 * it would trust the leftmost entry, which the client controls.
 *
 * @returns False for no trust, or the trusted hop count.
 */
export function parseTrustProxyEnv(
  configService: ConfigService,
): boolean | number {
  const raw = configService.get<string>("TRUST_PROXY");
  if (raw === undefined || raw.trim() === "") {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "false") {
    return false;
  }
  const isDecimalInteger =
    normalized.length > 0 &&
    normalized
      .split("")
      .every((character) => character >= "0" && character <= "9");
  const parsed = Number(normalized);
  if (!isDecimalInteger || !Number.isSafeInteger(parsed)) {
    throw new Error(
      `Invalid TRUST_PROXY="${raw}": must be "false", unset, or a non-negative integer hop count.`,
    );
  }
  return parsed;
}
