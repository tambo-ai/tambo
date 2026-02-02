import { describe, it, expect, vi } from "vitest";
import { createTamboClient, isTamboClient } from "./client.js";

// Mock TamboAI
vi.mock("@tambo-ai/typescript-sdk", () => {
  return {
    default: class MockTamboAI {
      apiKey: string;
      baseURL?: string;
      defaultHeaders: Record<string, string>;
      beta = { threads: {} };

      constructor(options: {
        apiKey: string;
        baseURL?: string;
        defaultHeaders?: Record<string, string>;
      }) {
        this.apiKey = options.apiKey;
        this.baseURL = options.baseURL;
        this.defaultHeaders = options.defaultHeaders ?? {};
      }
    },
  };
});

describe("createTamboClient", () => {
  it("should create a client with required apiKey", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    expect(client).toBeDefined();
    expect((client as unknown as { apiKey: string }).apiKey).toBe("test-key");
  });

  it("should throw error when apiKey is missing", () => {
    expect(() => createTamboClient({ apiKey: "" })).toThrow(
      "Tambo API key is required",
    );
  });

  it("should set custom baseURL when provided", () => {
    const client = createTamboClient({
      apiKey: "test-key",
      tamboUrl: "https://custom.api.com",
    });
    expect((client as unknown as { baseURL: string }).baseURL).toBe(
      "https://custom.api.com",
    );
  });

  it("should include version header", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    const headers = (
      client as unknown as { defaultHeaders: Record<string, string> }
    ).defaultHeaders;
    expect(headers["X-Tambo-Svelte-Version"]).toBe("0.1.0");
  });

  it("should include user token header when provided", () => {
    const client = createTamboClient({
      apiKey: "test-key",
      userToken: "user-123",
    });
    const headers = (
      client as unknown as { defaultHeaders: Record<string, string> }
    ).defaultHeaders;
    expect(headers["X-Tambo-User-Token"]).toBe("user-123");
  });

  it("should merge additional headers", () => {
    const client = createTamboClient({
      apiKey: "test-key",
      additionalHeaders: { "X-Custom-Header": "custom-value" },
    });
    const headers = (
      client as unknown as { defaultHeaders: Record<string, string> }
    ).defaultHeaders;
    expect(headers["X-Custom-Header"]).toBe("custom-value");
  });

  it("should create new instances each time (no singleton)", () => {
    const client1 = createTamboClient({ apiKey: "key-1" });
    const client2 = createTamboClient({ apiKey: "key-2" });
    expect(client1).not.toBe(client2);
  });
});

describe("isTamboClient", () => {
  it("should return true for TamboAI client", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    expect(isTamboClient(client)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isTamboClient(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isTamboClient(undefined)).toBe(false);
  });

  it("should return false for plain object", () => {
    expect(isTamboClient({})).toBe(false);
  });

  it("should return false for object without beta property", () => {
    expect(isTamboClient({ foo: "bar" })).toBe(false);
  });

  it("should return false for object with non-object beta property", () => {
    expect(isTamboClient({ beta: "string" })).toBe(false);
  });

  it("should return true for object with beta object property", () => {
    expect(isTamboClient({ beta: {} })).toBe(true);
  });
});
