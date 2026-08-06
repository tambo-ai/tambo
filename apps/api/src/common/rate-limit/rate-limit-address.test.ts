import { normalizeRateLimitAddress } from "./rate-limit-address";

describe("normalizeRateLimitAddress", () => {
  it("preserves IPv4 addresses", () => {
    expect(normalizeRateLimitAddress("192.0.2.10")).toBe("192.0.2.10");
  });

  it("groups IPv6 addresses by /64", () => {
    expect(normalizeRateLimitAddress("2001:db8:0:1::10")).toBe(
      "ipv6:2001:0db8:0000:0001",
    );
    expect(normalizeRateLimitAddress("2001:db8:0:1::20")).toBe(
      "ipv6:2001:0db8:0000:0001",
    );
  });

  it("uses unknown for invalid addresses", () => {
    expect(normalizeRateLimitAddress("not-an-ip")).toBe("unknown");
  });
});
