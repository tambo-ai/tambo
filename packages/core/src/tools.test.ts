import { SseError } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPTransport } from "./mcp-client";
import { validateMcpServer } from "./tools";

// Mock MCPClient.create so tests never hit the network
jest.mock("./mcp-client", () => {
  const actual =
    jest.requireActual<typeof import("./mcp-client")>("./mcp-client");
  return {
    ...actual,
    MCPClient: {
      create: jest.fn(),
    },
  };
});

const { MCPClient } = jest.requireMock<{
  MCPClient: {
    create: jest.Mock;
  };
}>("./mcp-client");

const baseArgs = {
  url: "https://example.com/mcp",
  mcpTransport: MCPTransport.HTTP,
};

describe("validateMcpServer", () => {
  beforeEach(() => {
    MCPClient.create.mockReset();
  });

  it("returns valid with capabilities on successful connection", async () => {
    MCPClient.create.mockResolvedValue({
      getServerCapabilities: () => ({ tools: {} }),
      getServerVersion: () => ({ name: "test", version: "1.0" }),
      getInstructions: () => "do stuff",
    });

    const result = await validateMcpServer(baseArgs);

    expect(result).toEqual({
      valid: true,
      capabilities: { tools: {} },
      version: { name: "test", version: "1.0" },
      instructions: "do stuff",
      requiresAuth: false,
      statusCode: 200,
    });
  });

  it("marks requiresAuth true when oauthProvider is provided", async () => {
    MCPClient.create.mockResolvedValue({
      getServerCapabilities: () => ({}),
      getServerVersion: () => ({}),
      getInstructions: () => undefined,
    });

    const result = await validateMcpServer({
      ...baseArgs,
      oauthProvider: {} as never,
    });

    expect(result.requiresAuth).toBe(true);
  });

  describe("SseError handling", () => {
    it("returns valid with requiresAuth on 401", async () => {
      MCPClient.create.mockRejectedValue(new SseError(401, "unauthorized"));

      const result = await validateMcpServer(baseArgs);

      expect(result).toEqual({
        valid: true,
        error: expect.stringContaining("authentication"),
        statusCode: 401,
        requiresAuth: true,
      });
    });

    it("returns invalid with normalized status code for non-401", async () => {
      MCPClient.create.mockRejectedValue(new SseError(403, "forbidden"));

      const result = await validateMcpServer(baseArgs);

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error).toContain("SSE");
    });

    it("normalizes undefined status code to 500", async () => {
      const err = new SseError(undefined as unknown as number, "bad");

      MCPClient.create.mockRejectedValue(err);

      const result = await validateMcpServer(baseArgs);

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(500);
    });
  });

  describe("StreamableHTTPError handling", () => {
    it("returns valid with requiresAuth on 401", async () => {
      MCPClient.create.mockRejectedValue(
        new StreamableHTTPError(401, "unauthorized"),
      );

      const result = await validateMcpServer(baseArgs);

      expect(result).toEqual({
        valid: true,
        error: expect.stringContaining("authentication"),
        statusCode: 401,
        requiresAuth: true,
      });
    });

    it("returns invalid with normalized status code for non-401", async () => {
      MCPClient.create.mockRejectedValue(
        new StreamableHTTPError(500, "server error"),
      );

      const result = await validateMcpServer(baseArgs);

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.error).toContain("Streamable HTTP");
    });

    it("normalizes out-of-range status code to 500", async () => {
      MCPClient.create.mockRejectedValue(
        new StreamableHTTPError(9999, "weird"),
      );

      const result = await validateMcpServer(baseArgs);

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(500);
    });
  });

  describe("generic Error handling", () => {
    it("returns not found for ENOTFOUND errors", async () => {
      MCPClient.create.mockRejectedValue(
        new Error("getaddrinfo ENOTFOUND example.com"),
      );

      const result = await validateMcpServer(baseArgs);

      expect(result).toEqual({
        valid: false,
        error: "Server not found: could not resolve the URL",
        statusCode: 404,
        requiresAuth: false,
      });
    });

    it("returns valid with requiresAuth on HTTP 401 message", async () => {
      MCPClient.create.mockRejectedValue(new Error("HTTP 401 Unauthorized"));

      const result = await validateMcpServer(baseArgs);

      expect(result).toEqual({
        valid: true,
        statusCode: 401,
        requiresAuth: true,
      });
    });

    it("returns invalid with error message for other errors", async () => {
      MCPClient.create.mockRejectedValue(new Error("connection refused"));

      const result = await validateMcpServer(baseArgs);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("connection refused");
      expect(result.statusCode).toBe(500);
    });
  });

  describe("non-Error throw handling", () => {
    it("stringifies non-Error thrown values", async () => {
      MCPClient.create.mockRejectedValue("some string error");

      const result = await validateMcpServer(baseArgs);

      expect(result).toEqual({
        valid: false,
        error: "some string error",
        statusCode: 500,
        requiresAuth: false,
      });
    });
  });
});
