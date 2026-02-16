/**
 * Tests for createTamboClient
 */

import { createTamboClient } from "./client";
import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/query-core";

jest.mock("@tambo-ai/typescript-sdk");

describe("createTamboClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw if apiKey is empty string", () => {
    expect(() => createTamboClient({ apiKey: "" })).toThrow(
      "API key is required",
    );
  });

  it("should throw if apiKey is only whitespace", () => {
    expect(() => createTamboClient({ apiKey: "   " })).toThrow(
      "API key is required",
    );
  });

  it("should create SDK client with apiKey", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    expect(TamboAI).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(client.sdk).toBeDefined();
  });

  it("should pass baseUrl to SDK as baseURL", () => {
    createTamboClient({
      apiKey: "test-key",
      baseUrl: "https://custom.api.com",
    });
    expect(TamboAI).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://custom.api.com",
    });
  });

  it("should use injected sdkClient when provided", () => {
    const mockSdk = {} as TamboAI;
    const client = createTamboClient({
      apiKey: "test-key",
      sdkClient: mockSdk,
    });
    expect(client.sdk).toBe(mockSdk);
    expect(TamboAI).not.toHaveBeenCalled();
  });

  it("should create QueryClient with default options", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    expect(client.queryClient).toBeInstanceOf(QueryClient);
  });

  it("should use injected queryClient when provided", () => {
    const mockQueryClient = new QueryClient();
    const client = createTamboClient({
      apiKey: "test-key",
      queryClient: mockQueryClient,
    });
    expect(client.queryClient).toBe(mockQueryClient);
  });

  it("should expose threads sub-client", () => {
    const client = createTamboClient({ apiKey: "test-key" });
    expect(client.threads).toBeDefined();
  });
});
