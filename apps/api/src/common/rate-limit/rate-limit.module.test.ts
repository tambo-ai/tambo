import { ConfigService } from "@nestjs/config";
import { parseRateLimitEnv } from "./rate-limit.module";

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
});
