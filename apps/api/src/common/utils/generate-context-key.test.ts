import { generateContextKey } from "./generate-context-key";

describe("generateContextKey", () => {
  describe("Google OAuth", () => {
    it("should generate correct context key for Google consumer account", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        {}, // No organizational claims for consumer accounts
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });

    it("should generate correct context key for Google Workspace account", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: "company.com" }, // Hosted domain for workspace
        "workspace-user-456",
      );

      expect(result).toBe(
        "oauth:user:accounts.google.com:company.com:workspace-user-456",
      );
    });

    it("should preserve hosted domain with special characters", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: "my-company@domain.com" }, // Domain with special characters
        "workspace-user-789",
      );

      expect(result).toBe(
        "oauth:user:accounts.google.com:my-company@domain.com:workspace-user-789",
      );
    });

    it("should handle null hosted domain claim", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: null },
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });

    it("should handle empty string hosted domain claim", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: "" },
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });
  });

  describe("Microsoft Azure AD / Entra ID", () => {
    it("should generate correct context key for Azure AD with tenant ID", () => {
      const result = generateContextKey(
        "https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0",
        { tid: "12345678-1234-1234-1234-123456789012" },
        "azure-user-123",
      );

      expect(result).toBe(
        "oauth:user:login.microsoftonline.com:12345678-1234-1234-1234-123456789012:azure-user-123",
      );
    });

    it("should handle different Microsoft online domains", () => {
      const result = generateContextKey(
        "https://sts.windows.net/tenant-id/",
        { tid: "tenant-guid-123" },
        "azure-user-456",
      );

      expect(result).toBe(
        "oauth:user:sts.windows.net:tenant-guid-123:azure-user-456",
      );
    });

    it("should fall back to hostname when no tenant ID present", () => {
      const result = generateContextKey(
        "https://login.microsoftonline.com/common/v2.0",
        {}, // No tenant ID
        "azure-user-789",
      );

      expect(result).toBe(
        "oauth:user:login.microsoftonline.com:azure-user-789",
      );
    });
  });

  describe("WorkOS", () => {
    it("should generate correct context key with org_id", () => {
      const result = generateContextKey(
        "https://api.workos.com",
        { org_id: "org_01234567890abcdef" },
        "workos-user-123",
      );

      expect(result).toBe(
        "oauth:user:api.workos.com:org_01234567890abcdef:workos-user-123",
      );
    });
  });

  describe("Auth0 Organizations", () => {
    it("should generate correct context key with org_id", () => {
      const result = generateContextKey(
        "https://tenant.auth0.com/",
        { org_id: "org_abc123def456" },
        "auth0-user-123",
      );

      expect(result).toBe(
        "oauth:user:tenant.auth0.com:org_abc123def456:auth0-user-123",
      );
    });
  });

  describe("Other OAuth providers", () => {
    it("should generate correct context key for GitHub", () => {
      const result = generateContextKey(
        "https://github.com",
        {},
        "github-user-123",
      );

      expect(result).toBe("oauth:user:github.com:github-user-123");
    });

    it("should generate correct context key for LinkedIn", () => {
      const result = generateContextKey(
        "https://www.linkedin.com",
        {},
        "linkedin-user-456",
      );

      expect(result).toBe("oauth:user:www.linkedin.com:linkedin-user-456");
    });

    it("should handle custom enterprise provider with org claims", () => {
      const result = generateContextKey(
        "https://sso.custom-company.com",
        { org_id: "enterprise-org-123" },
        "enterprise-user-789",
      );

      expect(result).toBe(
        "oauth:user:sso.custom-company.com:enterprise-org-123:enterprise-user-789",
      );
    });
  });

  describe("Edge cases and error handling", () => {
    it("should fall back to legacy format when issuer is invalid", () => {
      const result = generateContextKey(
        null as any, // Cast to any to test the null case
        { hd: "company.com" },
        "user-123",
      );

      expect(result).toBe("oauth:user:user-123");
    });

    it("should handle invalid URL in issuer", () => {
      const result = generateContextKey("not-a-valid-url", {}, "user-456");

      expect(result).toBe("oauth:user:not-a-valid-url:user-456");
    });

    it("should handle missing subject", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: "company.com" },
        "",
      );

      expect(result).toBe("oauth:user:accounts.google.com:company.com:");
    });

    it("should ignore non-string organizational claims", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        { hd: 123 as any }, // Cast to any to test invalid type
        "user-789",
      );

      expect(result).toBe("oauth:user:accounts.google.com:user-789");
    });
  });

  describe("Priority and precedence", () => {
    it("should prioritize Microsoft tid over org_id for Microsoft issuers", () => {
      const result = generateContextKey(
        "https://login.microsoftonline.com/tenant/v2.0",
        {
          tid: "microsoft-tenant-123",
          org_id: "some-other-org-456",
        },
        "user-123",
      );

      expect(result).toBe(
        "oauth:user:login.microsoftonline.com:microsoft-tenant-123:user-123",
      );
    });

    it("should prioritize Google hd over org_id for Google issuers", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        {
          hd: "workspace.example.com",
          org_id: "some-other-org-789",
        },
        "user-456",
      );

      expect(result).toBe(
        "oauth:user:accounts.google.com:workspace.example.com:user-456",
      );
    });
  });
});
