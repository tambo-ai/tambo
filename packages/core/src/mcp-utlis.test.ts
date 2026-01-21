import { deriveServerKey, isValidServerKey } from "./mcp-utils";

describe("deriveServerKey", () => {
  describe("valid URL inputs", () => {
    it("extracts key from simple domain", () => {
      expect(deriveServerKey("https://google.com")).toBe("google");
    });

    it("handles sub-domains like api", () => {
      expect(deriveServerKey("https://api.github.com")).toBe("github");
    });

    it("handles mcp sub-domain with path", () => {
      expect(deriveServerKey("https://mcp.linear.app/mcp")).toBe("linear");
    });

    it("handles www prefix", () => {
      expect(deriveServerKey("https://www.example.com")).toBe("example");
    });

    it("handles multiple sub-domains", () => {
      expect(deriveServerKey("https://staging.api.company.com")).toBe(
        "company",
      );
    });
  });

  describe("TLD handling", () => {
    it("removes single-part TLDs like .com", () => {
      expect(deriveServerKey("https://google.com")).toBe("google");
    });

    it("removes multi-part TLDs like .co.uk", () => {
      expect(deriveServerKey("https://google.co.uk")).toBe("google");
    });

    it("handles company domains with country TLDs", () => {
      expect(deriveServerKey("https://mcp.company.co.uk")).toBe("company");
    });

    it("handles .com.au domains", () => {
      expect(deriveServerKey("https://api.startup.com.au")).toBe("startup");
    });
  });

  describe("common prefix filtering", () => {
    it("skips known prefixes like api, mcp, app", () => {
      expect(deriveServerKey("https://api.mcp.app.example.com")).toBe(
        "example",
      );
    });

    it("falls back when all parts are prefixes", () => {
      expect(deriveServerKey("https://api.dev.prod.com")).toBe("prod");
    });
  });

  describe("edge cases", () => {
    it("handles localhost", () => {
      expect(deriveServerKey("http://localhost")).toBe("localhost");
    });

    it("handles IP addresses", () => {
      expect(deriveServerKey("http://127.0.0.1")).toBe("127_0_0_1");
    });

    it("handles other IPv4 addresses", () => {
      expect(deriveServerKey("http://255.255.255.254")).toBe("255_255_255_254");
    });

    it("handles URLs with ports", () => {
      expect(deriveServerKey("http://api.example.com:8080")).toBe("example");
    });

    it("returns lowercase result", () => {
      expect(deriveServerKey("https://API.GitHub.COM")).toBe("github");
    });
  });

  describe("invalid URL input", () => {
    it("returns sanitized value for invalid URL strings", () => {
      expect(deriveServerKey("not_a_valid_url")).toBe("not_a_valid_url");
    });

    it("sanitizes strings with special characters", () => {
      expect(deriveServerKey("$$$bad url%%%")).toBe("___bad_url___");
    });

    it("returns empty string for empty input", () => {
      expect(deriveServerKey("")).toBe("");
    });
  });
});

describe("isValidServerKey", () => {
  describe("valid keys", () => {
    it("accepts alphanumeric keys", () => {
      expect(isValidServerKey("github")).toBe(true);
      expect(isValidServerKey("server123")).toBe(true);
    });

    it("accepts underscores", () => {
      expect(isValidServerKey("my_server")).toBe(true);
    });

    it("accepts trimmed keys", () => {
      expect(isValidServerKey("  valid_key  ")).toBe(true);
    });
  });

  describe("invalid keys", () => {
    it("rejects keys shorter than 2 characters", () => {
      expect(isValidServerKey("a")).toBe(false);
      expect(isValidServerKey(" ")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidServerKey("")).toBe(false);
    });

    it("rejects keys with spaces", () => {
      expect(isValidServerKey("bad key")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidServerKey("bad-key")).toBe(false);
      expect(isValidServerKey("bad$key")).toBe(false);
      expect(isValidServerKey("bad.key")).toBe(false);
    });
  });

  describe("boundary cases", () => {
    it("accepts exactly 2 characters", () => {
      expect(isValidServerKey("ab")).toBe(true);
    });
  });
});
