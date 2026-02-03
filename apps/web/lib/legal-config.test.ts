// Mock the env module to avoid import.meta issues in Jest
jest.mock("./env", () => ({
  env: {
    NEXT_PUBLIC_TERMS_URL: "/terms",
    NEXT_PUBLIC_PRIVACY_URL: "/privacy",
    NEXT_PUBLIC_LICENSE_URL: "/license",
  },
}));

import { LEGAL_CONFIG, needsLegalAcceptance } from "./legal-config";

describe("LEGAL_CONFIG", () => {
  it("has required properties", () => {
    expect(LEGAL_CONFIG.CURRENT_VERSION).toBeDefined();
    expect(LEGAL_CONFIG.FORCE_REACCEPT).toBeDefined();
    expect(LEGAL_CONFIG.MINIMUM_VERSION).toBeDefined();
    expect(LEGAL_CONFIG.URLS).toBeDefined();
  });

  it("has URL configurations", () => {
    expect(LEGAL_CONFIG.URLS.TERMS).toBeDefined();
    expect(LEGAL_CONFIG.URLS.PRIVACY).toBeDefined();
    expect(LEGAL_CONFIG.URLS.LICENSE).toBeDefined();
  });
});

describe("needsLegalAcceptance", () => {
  it("returns true when userVersion is null", () => {
    expect(needsLegalAcceptance(null)).toBe(true);
  });

  it("returns true when forceReaccept is true", () => {
    expect(needsLegalAcceptance("vZ", true)).toBe(true);
  });

  it("returns true when userVersion is below minimum", () => {
    // vA < vF (minimum version)
    expect(needsLegalAcceptance("vA")).toBe(true);
  });

  it("returns false when userVersion meets minimum", () => {
    expect(needsLegalAcceptance("vF")).toBe(false);
  });

  it("returns false when userVersion exceeds minimum", () => {
    expect(needsLegalAcceptance("vZ")).toBe(false);
  });
});
