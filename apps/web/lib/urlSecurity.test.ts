describe("urlSecurity", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("validateSafeURLForMcp skips validation when ALLOW_LOCAL_MCP_SERVERS is set", async () => {
    jest.doMock("@/lib/env", () => ({ env: { ALLOW_LOCAL_MCP_SERVERS: "1" } }));
    const { validateSafeURLForMcp } = await import("@/lib/urlSecurity");
    const res = await validateSafeURLForMcp("http://localhost:8260");
    expect(res.safe).toBe(true);
  });

  test("validateSafeURL does NOT honour ALLOW_LOCAL_MCP_SERVERS (scope guard)", async () => {
    jest.doMock("@/lib/env", () => ({ env: { ALLOW_LOCAL_MCP_SERVERS: "1" } }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    // Non-MCP callers (custom LLM base URL, agent URL) must always validate
    // regardless of the dev flag.
    const res = await validateSafeURL("http://localhost:8260");
    expect(res.safe).toBe(false);
  });

  test("allowLocalMcp option bypasses validation", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("http://localhost:8260", {
      allowLocalMcp: true,
    });
    expect(res.safe).toBe(true);
  });

  test("rejects non-HTTPS URLs", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("http://example.com");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe("Only HTTPS protocol is allowed");
  });

  test("rejects invalid domains via tldts", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: false, hostname: null }),
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("not-a-domain");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe("URL is not a valid domain");
  });

  test("rejects if A record resolves to private IPv4", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => ["127.0.0.1"],
      resolve6: async () => {
        throw new Error("ENODATA");
      },
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("example.com");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe(
      "URL resolves to a private or internal network address",
    );
  });

  test("rejects if AAAA record resolves to IPv6 loopback (dual-stack bypass)", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "attacker.example" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => ["8.8.8.8"],
      resolve6: async () => ["::1"],
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("https://attacker.example/");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe(
      "URL resolves to a private or internal network address",
    );
  });

  test("returns unsafe when both A and AAAA fail", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => {
        throw new Error("NXDOMAIN");
      },
      resolve6: async () => {
        throw new Error("NXDOMAIN");
      },
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("example.com");
    expect(res.safe).toBe(false);
    expect(res.reason).toContain("Unable to verify URL safety");
  });

  test("accepts hostname with public A and no AAAA", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => ["1.1.1.1"],
      resolve6: async () => {
        throw new Error("ENODATA");
      },
    }));
    const { validateSafeURL, validateServerUrl } =
      await import("@/lib/urlSecurity");
    await expect(validateSafeURL("example.com")).resolves.toEqual({
      safe: true,
    });
    await expect(validateServerUrl("example.com")).resolves.toBe(true);
  });

  test("accepts hostname with only AAAA pointing to a public address", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "v6.cloudflare.com" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => {
        throw new Error("ENODATA");
      },
      resolve6: async () => ["2606:4700:4700::1111"],
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("v6.cloudflare.com");
    expect(res).toEqual({ safe: true });
  });

  test.each([
    ["IPv4-mapped IPv6 loopback", "::ffff:127.0.0.1"],
    ["IPv6 unspecified", "::"],
    ["RFC 4193 ULA fd00:: (AWS IPv6 IMDS prefix)", "fd00:ec2::254"],
    ["RFC 4193 ULA fcXX::", "fc01:0:0:0:0:0:0:1"],
    ["RFC 6598 CGNAT", "100.64.0.1"],
    ["0.0.0.0/8", "0.0.0.5"],
    ["multicast IPv4", "239.0.0.1"],
    ["broadcast", "255.255.255.255"],
    ["multicast IPv6", "ff02::1"],
  ])("rejects unsafe resolved address: %s", async (_label, addr) => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "attacker.tld" }),
    }));
    const isV6 = addr.includes(":");
    jest.doMock("dns/promises", () => ({
      resolve4: async () => (isV6 ? [] : [addr]),
      resolve6: async () => (isV6 ? [addr] : []),
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("https://attacker.tld/");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe(
      "URL resolves to a private or internal network address",
    );
  });

  test.each([
    ["single-label hostname", "internal"],
    ["literal localhost", "localhost"],
    [".local mDNS", "printer.local"],
    [".test reserved TLD", "service.test"],
    [".example reserved TLD", "demo.example"],
    [".invalid reserved TLD", "broken.invalid"],
  ])("rejects unsafe hostname pre-DNS: %s", async (_label, hostname) => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve4: async () => ["1.1.1.1"],
      resolve6: async () => {
        throw new Error("ENODATA");
      },
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL(hostname);
    expect(res.safe).toBe(false);
  });
});
