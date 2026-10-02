import { ConfigService } from "@nestjs/config";
import {
  RATE_LIMIT_DEFAULT,
  RATE_LIMIT_MAX,
  isRateLimitEnabled,
  parseRateLimitEnv,
  parseTrustProxyEnv,
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

describe("isRateLimitEnabled", () => {
  it("is disabled when unset or empty", () => {
    expect(isRateLimitEnabled(createConfigService({}))).toBe(false);
    expect(
      isRateLimitEnabled(createConfigService({ RATE_LIMIT_ENABLED: "" })),
    ).toBe(false);
  });

  it.each(["true", "True", " TRUE "])("enables on %s", (value) => {
    expect(
      isRateLimitEnabled(createConfigService({ RATE_LIMIT_ENABLED: value })),
    ).toBe(true);
  });

  it.each(["false", "False", " FALSE "])("stays disabled on %s", (value) => {
    expect(
      isRateLimitEnabled(createConfigService({ RATE_LIMIT_ENABLED: value })),
    ).toBe(false);
  });

  it.each(["yes", "1", "on"])("rejects %s", (value) => {
    expect(() =>
      isRateLimitEnabled(createConfigService({ RATE_LIMIT_ENABLED: value })),
    ).toThrow(`Invalid RATE_LIMIT_ENABLED="${value}"`);
  });
});

describe("parseTrustProxyEnv", () => {
  it("trusts nothing when unset, empty, or false", () => {
    expect(parseTrustProxyEnv(createConfigService({}))).toBe(false);
    expect(parseTrustProxyEnv(createConfigService({ TRUST_PROXY: "" }))).toBe(
      false,
    );
    expect(
      parseTrustProxyEnv(createConfigService({ TRUST_PROXY: "false" })),
    ).toBe(false);
    expect(
      parseTrustProxyEnv(createConfigService({ TRUST_PROXY: " False " })),
    ).toBe(false);
  });

  it.each(["0", "1", "2"])("trusts %s hops", (value) => {
    expect(
      parseTrustProxyEnv(createConfigService({ TRUST_PROXY: value })),
    ).toBe(Number(value));
  });

  it.each(["true", "yes", "-1", "1.5", "0x1", "one"])("rejects %s", (value) => {
    expect(() =>
      parseTrustProxyEnv(createConfigService({ TRUST_PROXY: value })),
    ).toThrow(`Invalid TRUST_PROXY="${value}"`);
  });
});
