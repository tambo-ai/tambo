describe("urlSecurity", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("skips validation when ALLOW_LOCAL_MCP_SERVERS is set", async () => {
    jest.doMock("@/lib/env", () => ({ env: { ALLOW_LOCAL_MCP_SERVERS: "1" } }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("http://localhost:8260");
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

  test("rejects if DNS resolve returns private IP", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({ resolve: async () => ["127.0.0.1"] }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("example.com");
    expect(res.safe).toBe(false);
    expect(res.reason).toBe(
      "URL resolves to a private or internal network address",
    );
  });

  test("returns unsafe when DNS fails", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({
      resolve: async () => {
        throw new Error("NXDOMAIN");
      },
    }));
    const { validateSafeURL } = await import("@/lib/urlSecurity");
    const res = await validateSafeURL("example.com");
    expect(res.safe).toBe(false);
    expect(res.reason).toContain("Unable to verify URL safety");
  });

  test("accepts valid public DNS resolution", async () => {
    jest.doMock("@/lib/env", () => ({ env: {} }));
    jest.doMock("tldts", () => ({
      parse: () => ({ isIcann: true, hostname: "example.com" }),
    }));
    jest.doMock("dns/promises", () => ({ resolve: async () => ["1.1.1.1"] }));
    const { validateSafeURL, validateServerUrl } =
      await import("@/lib/urlSecurity");
    await expect(validateSafeURL("example.com")).resolves.toEqual({
      safe: true,
    });
    await expect(validateServerUrl("example.com")).resolves.toBe(true);
  });
});
