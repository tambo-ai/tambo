import { ConfigService } from "@nestjs/config";

const rateLimitValues = {
  streaming: 20,
  strict: 10,
};

export function parseRateLimitEnv(
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

export function initializeRateLimitConfig(
  configService: ConfigService,
): number {
  const rateLimitDefault = parseRateLimitEnv(
    configService,
    "RATE_LIMIT_DEFAULT",
    100,
  );
  rateLimitValues.streaming = parseRateLimitEnv(
    configService,
    "RATE_LIMIT_STREAMING",
    20,
  );
  rateLimitValues.strict = parseRateLimitEnv(
    configService,
    "RATE_LIMIT_STRICT",
    10,
  );
  return rateLimitDefault;
}

export function getRateLimitStreaming(): number {
  return rateLimitValues.streaming;
}

export function getRateLimitStrict(): number {
  return rateLimitValues.strict;
}
