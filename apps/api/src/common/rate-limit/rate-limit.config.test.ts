import { ConfigService } from "@nestjs/config";
import {
  RATE_LIMIT_DEFAULT,
  RATE_LIMIT_MAX,
  parseRateLimitEnv,
  resolveRateLimitDefault,
} from "./rate-limit.config";

function createConfigService(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe("parseRateLimitEnv", () => {
  it("returns the fallback when the key is unset or empty", () => {
    expect(
      parseRateLimitEnv(createConfigService({}), "RATE_LIMIT_DEFAULT", 25),
    ).toBe(25);
    expect(
      parseRateLimitEnv(
        createConfigService({ RATE_LIMIT_DEFAULT: "" }),
        "RATE_LIMIT_DEFAULT",
        25,
      ),
    ).toBe(25);
    expect(
      parseRateLimitEnv(
        createConfigService({ RATE_LIMIT_DEFAULT: "   " }),
        "RATE_LIMIT_DEFAULT",
        25,
      ),
    ).toBe(25);
  });

  it("parses plain decimal integers, ignoring surrounding whitespace", () => {
    expect(
      parseRateLimitEnv(
        createConfigService({ RATE_LIMIT_DEFAULT: "42" }),
        "RATE_LIMIT_DEFAULT",
        25,
      ),
    ).toBe(42);
    expect(
      parseRateLimitEnv(
        createConfigService({ RATE_LIMIT_DEFAULT: "  42  " }),
        "RATE_LIMIT_DEFAULT",
        25,
      ),
    ).toBe(42);
  });

  it.each(["0", "-5", "20.5", "0x64", "1e9", "abc", "12ab"])(
    "rejects %s",
    (value) => {
      expect(() =>
        parseRateLimitEnv(
          createConfigService({ RATE_LIMIT_DEFAULT: value }),
          "RATE_LIMIT_DEFAULT",
          25,
        ),
      ).toThrow(`Invalid RATE_LIMIT_DEFAULT="${value}"`);
    },
  );

  it("rejects values above the maximum", () => {
    expect(() =>
      parseRateLimitEnv(
        createConfigService({
          RATE_LIMIT_DEFAULT: `${RATE_LIMIT_MAX + 1}`,
        }),
        "RATE_LIMIT_DEFAULT",
        25,
      ),
    ).toThrow(`Invalid RATE_LIMIT_DEFAULT="${RATE_LIMIT_MAX + 1}"`);
  });
});

describe("resolveRateLimitDefault", () => {
  it("falls back to 100 when unset", () => {
    expect(resolveRateLimitDefault(createConfigService({}))).toBe(
      RATE_LIMIT_DEFAULT,
    );
  });

  it("reads RATE_LIMIT_DEFAULT from configuration", () => {
    expect(
      resolveRateLimitDefault(
        createConfigService({ RATE_LIMIT_DEFAULT: "250" }),
      ),
    ).toBe(250);
  });

  it("resolves through the NestJS ConfigService", () => {
    process.env.RATE_LIMIT_DEFAULT = "175";
    try {
      expect(resolveRateLimitDefault(new ConfigService())).toBe(175);
    } finally {
      delete process.env.RATE_LIMIT_DEFAULT;
    }
  });
});
