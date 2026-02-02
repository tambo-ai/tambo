/**
 * Tests to ensure hardcoded URLs use the correct domain (tambo.co, not tambo.ai)
 */
import { describe, expect, it } from "vitest";

import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "./mcp-auth";

const INCORRECT_DOMAIN = "tambo.ai";
const CORRECT_DOMAIN = "tambo.co";

/**
 * Asserts that a URL string uses the correct tambo.co domain
 */
function assertCorrectDomain(
  url: string,
  context: string,
): asserts url is string {
  if (url.includes(INCORRECT_DOMAIN)) {
    throw new Error(
      `${context} uses incorrect domain '${INCORRECT_DOMAIN}'. ` +
        `Should use '${CORRECT_DOMAIN}'. Value: ${url}`,
    );
  }
}

describe("domain URL validation", () => {
  describe("packages/core constants", () => {
    it("TAMBO_MCP_ACCESS_KEY_CLAIM should use tambo.co domain", () => {
      assertCorrectDomain(
        TAMBO_MCP_ACCESS_KEY_CLAIM,
        "TAMBO_MCP_ACCESS_KEY_CLAIM",
      );
      expect(TAMBO_MCP_ACCESS_KEY_CLAIM).toContain(CORRECT_DOMAIN);
    });
  });

  describe("common URL patterns", () => {
    const validDomainPatterns = [
      "https://tambo.co",
      "https://docs.tambo.co",
      "https://api.tambo.co",
      "https://ui.tambo.co",
      "https://console.tambo.co",
      "https://mcp.tambo.co",
    ];

    it.each(validDomainPatterns)(
      "should recognize %s as valid",
      (url: string) => {
        expect(url).toContain(CORRECT_DOMAIN);
        expect(url).not.toContain(INCORRECT_DOMAIN);
      },
    );

    const invalidDomainPatterns = [
      "https://tambo.ai",
      "https://docs.tambo.ai",
      "https://api.tambo.ai",
    ];

    it.each(invalidDomainPatterns)(
      "should reject %s as invalid",
      (url: string) => {
        expect(url).toContain(INCORRECT_DOMAIN);
      },
    );
  });
});
