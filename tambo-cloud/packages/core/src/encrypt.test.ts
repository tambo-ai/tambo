import { jest } from "@jest/globals";
import { decryptApiKey, encryptApiKey } from "./encrypt";

/**
 * Deterministic IV so we can compare final user-facing strings.
 * All other crypto APIs retain their real implementation.
 */
jest.mock("crypto", () => {
  const actual = jest.requireActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: jest.fn((size: number) => Buffer.alloc(size, 1)), // 0x01 repeated
  };
});

const STORED = "myStoredValue";
const API_KEY = "super-secret-api-key";
const SECRET = "ultra-secret-password";

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips storedString & apiKey (new format)", () => {
    const encoded = encryptApiKey(STORED, API_KEY, SECRET);

    expect(encoded.startsWith("tambo_")).toBe(true);

    const { storedString, apiKey } = decryptApiKey(encoded, SECRET);
    expect(storedString).toBe(STORED);
    expect(apiKey).toBe(API_KEY);
  });

  it("decrypt → re-encrypt with same IV yields identical key", () => {
    const firstEncoded = encryptApiKey(STORED, API_KEY, SECRET);

    const { storedString, apiKey } = decryptApiKey(firstEncoded, SECRET);

    const secondEncoded = encryptApiKey(storedString, apiKey, SECRET);

    expect(secondEncoded).toBe(firstEncoded);
  });
});
