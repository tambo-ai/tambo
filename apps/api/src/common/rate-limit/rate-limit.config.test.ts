import { ConfigService } from "@nestjs/config";
import {
  getRateLimitStreaming,
  getRateLimitStrict,
  initializeRateLimitConfig,
  parseRateLimitEnv,
} from "./rate-limit.config";

function createConfigService(value: string | undefined): ConfigService {
  return {
    get: jest.fn().mockReturnValue(value),
  } as unknown as ConfigService;
}

describe("parseRateLimitEnv", () => {
  it("uses the fallback for an unset value", () => {
    expect(
      parseRateLimitEnv(createConfigService(undefined), "RATE_LIMIT_TEST", 25),
    ).toBe(25);
  });

  it("uses the fallback for an empty value", () => {
    expect(
      parseRateLimitEnv(createConfigService(""), "RATE_LIMIT_TEST", 25),
    ).toBe(25);
  });

  it("parses a positive numeric value", () => {
    expect(
      parseRateLimitEnv(createConfigService("12"), "RATE_LIMIT_TEST", 25),
    ).toBe(12);
  });

  it("rejects invalid values", () => {
    expect(() =>
      parseRateLimitEnv(createConfigService("invalid"), "RATE_LIMIT_TEST", 25),
    ).toThrow('Invalid RATE_LIMIT_TEST="invalid"');
  });

  it("validates and stores all route-specific limits during initialization", () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          RATE_LIMIT_DEFAULT: "100",
          RATE_LIMIT_STREAMING: "21",
          RATE_LIMIT_STRICT: "11",
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    expect(initializeRateLimitConfig(configService)).toBe(100);
    expect(getRateLimitStreaming()).toBe(21);
    expect(getRateLimitStrict()).toBe(11);
  });
});
