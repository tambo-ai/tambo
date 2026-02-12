/**
 * Tests for TamboClient
 */

import { TamboClient } from "./client";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("TamboClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw if apiKey is empty string", () => {
      expect(() => new TamboClient({ apiKey: "" })).toThrow(
        "API key is required",
      );
    });

    it("should throw if apiKey is only whitespace", () => {
      expect(() => new TamboClient({ apiKey: "   " })).toThrow(
        "API key is required",
      );
    });

    it("should accept valid apiKey", () => {
      expect(() => new TamboClient({ apiKey: "test-key" })).not.toThrow();
    });

    it("should use default baseUrl when not provided", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      expect(client).toBeDefined();
    });

    it("should accept custom baseUrl", () => {
      const client = new TamboClient({
        apiKey: "test-key",
        baseUrl: "https://custom.api.com",
      });
      expect(client).toBeDefined();
    });
  });

  describe("fetch", () => {
    it("should send Authorization header with Bearer token", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key-123" });
      await client.fetch("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tambo.co/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key-123",
          }),
        }),
      );
    });

    it("should use default baseUrl when not provided", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetch("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tambo.co/test",
        expect.any(Object),
      );
    });

    it("should use custom baseUrl when provided", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({
        apiKey: "test-key",
        baseUrl: "https://custom.api.com",
      });
      await client.fetch("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.api.com/test",
        expect.any(Object),
      );
    });

    it("should throw ApiError on 404 response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "not_found" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });

      await expect(client.fetch("/test")).rejects.toMatchObject({
        name: "ApiError",
        status: 404,
        statusText: "Not Found",
        body: { error: "not_found" },
      });
    });

    it("should throw ApiError on 400 response", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "invalid_request" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });

      await expect(client.fetch("/test")).rejects.toMatchObject({
        name: "ApiError",
        status: 400,
        statusText: "Bad Request",
      });
    });

    it("should return parsed JSON on success", async () => {
      const expectedData = { id: "123", name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => expectedData,
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });
      const result = await client.fetch<typeof expectedData>("/test");

      expect(result).toEqual(expectedData);
    });

    it("should send Content-Type application/json header", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetch("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should merge custom headers with defaults", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetch("/test", {
        headers: { "X-Custom-Header": "custom-value" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
            "X-Custom-Header": "custom-value",
          }),
        }),
      );
    });

    it("should send request body when provided", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key" });
      const body = { param: "value" };
      await client.fetch("/test", { method: "POST", body });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
    });

    it("should handle non-JSON error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Not JSON");
        },
        text: async () => "Plain text error",
      };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new TamboClient({ apiKey: "test-key", maxRetries: 1 });

      await expect(client.fetch("/test")).rejects.toMatchObject({
        name: "ApiError",
        status: 500,
        body: "Plain text error",
      });
    });
  });
});
