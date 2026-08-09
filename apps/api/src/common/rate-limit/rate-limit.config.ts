import { ConfigService } from "@nestjs/config";

const rateLimitValues = {
  streaming: 200,
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
  const normalized = raw.trim();
  const isDecimalInteger = normalized
    .split("")
    .every((character) => character >= "0" && character <= "9");
  const parsed = Number(normalized);
  if (!isDecimalInteger || !Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key}="${raw}": must be a positive integer.`);
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
    200,
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
