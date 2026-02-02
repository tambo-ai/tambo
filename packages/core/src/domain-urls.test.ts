/**
 * Tests to ensure hardcoded URLs use the correct domain (tambo.co)
 */
import { describe, expect, it } from "vitest";

import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "./mcp-auth";

const CORRECT_DOMAIN = "tambo.co";
const INCORRECT_DOMAINS = ["tambo.ai", "tambo.com"];

/**
 * Asserts that a URL string uses the correct tambo.co domain
 */
function assertCorrectDomain(
  url: string,
  context: string,
): asserts url is string {
  for (const incorrectDomain of INCORRECT_DOMAINS) {
    if (url.includes(incorrectDomain)) {
      throw new Error(
        `${context} uses incorrect domain '${incorrectDomain}'. ` +
          `Should use '${CORRECT_DOMAIN}'. Value: ${url}`,
      );
    }
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
        for (const incorrectDomain of INCORRECT_DOMAINS) {
          expect(url).not.toContain(incorrectDomain);
        }
      },
    );

    it.each(INCORRECT_DOMAINS)(
      "should reject URLs using %s domain",
      (incorrectDomain: string) => {
        const testUrls = [
          `https://${incorrectDomain}`,
          `https://docs.${incorrectDomain}`,
          `https://api.${incorrectDomain}`,
        ];
        for (const url of testUrls) {
          expect(url).toContain(incorrectDomain);
          expect(url).not.toContain(CORRECT_DOMAIN);
        }
      },
    );
  });
});
