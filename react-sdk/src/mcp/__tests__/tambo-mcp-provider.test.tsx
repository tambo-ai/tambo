import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { TamboMcpTokenProvider } from "../../providers/tambo-mcp-token-provider";
import { useTamboRegistry } from "../../providers/tambo-registry-provider";
import { MCPClient, MCPTransport } from "../mcp-client";
import {
  extractErrorMessage,
  TamboMcpProvider,
  useTamboMcpServers,
  type McpServer,
} from "../tambo-mcp-provider";

// Mock the MCP client to avoid ES module issues
jest.mock("../mcp-client", () => ({
  MCPClient: jest.fn(),
  MCPTransport: {
    SSE: "sse",
    HTTP: "http",
  },
}));

// Mock the registry provider to avoid dependency issues
jest.mock("../../providers/tambo-registry-provider", () => ({
  useTamboRegistry: jest.fn(),
}));

// Mock the client provider to avoid dependency issues
jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

describe("extractErrorMessage", () => {
  describe("Array content handling", () => {
    it("should extract text from array content with multiple text items", () => {
      const content = [
        { type: "text", text: "Error:" },
        { type: "text", text: "Tool execution failed" },
        { type: "image", url: "http://example.com/error.png" }, // Should be filtered out
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error: Tool execution failed");
    });

    it("should extract text from array content with single text item", () => {
      const content = [{ type: "text", text: "Simple error message" }];

      const result = extractErrorMessage(content);

      expect(result).toBe("Simple error message");
    });

    it("should return fallback message for array content with no text items", () => {
      const content = [
        { type: "image", url: "http://example.com/error.png" },
        { type: "resource", uri: "file://error.log" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error occurred but no details provided");
    });

    it("should return fallback message for empty array content", () => {
      const content: any[] = [];

      const result = extractErrorMessage(content);

      expect(result).toBe("Error occurred but no details provided");
    });

    it("should handle array content with mixed types correctly", () => {
      const content = [
        { type: "resource", uri: "file://log.txt" },
        { type: "text", text: "First error" },
        { type: "image", url: "http://example.com/img.png" },
        { type: "text", text: "Second error" },
        { type: "unknown", data: "something" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("First error Second error");
    });

    it("should handle array content with malformed items", () => {
      const content = [
        null,
        { type: "text", text: "Valid error" },
        { type: "text" }, // Missing text property
        { type: "text", text: null }, // Invalid text type
        { type: "text", text: "Another valid error" },
      ];

      const result = extractErrorMessage(content);

      expect(result).toBe("Valid error Another valid error");
    });
  });

  describe("Non-array content handling", () => {
    it("should return string content as-is", () => {
      const content = "Direct error message";

      const result = extractErrorMessage(content);

      expect(result).toBe("Direct error message");
    });

    it("should handle null content", () => {
      const content = null;

      const result = extractErrorMessage(content);

      expect(result).toBe("Unknown error occurred");
    });

    it("should handle undefined content", () => {
      const content = undefined;

      const result = extractErrorMessage(content);

      expect(result).toBe("Unknown error occurred");
    });

    it("should handle number content", () => {
      const content = 42;

      const result = extractErrorMessage(content);

      expect(result).toBe("42");
    });

    it("should handle boolean content", () => {
      const content = false;

      const result = extractErrorMessage(content);

      expect(result).toBe("false");
    });

    it("should handle object content", () => {
      const content = { error: "Something went wrong" };

      const result = extractErrorMessage(content);

      expect(result).toBe('{"error":"Something went wrong"}');
    });

    it("should handle complex object content", () => {
      const content = {
        error: "Something went wrong",
        code: 500,
        details: { message: "Internal server error" },
      };

      const result = extractErrorMessage(content);

      expect(result).toBe(
        '{"error":"Something went wrong","code":500,"details":{"message":"Internal server error"}}',
      );
    });

    it("should handle empty object content", () => {
      const content = {};

      const result = extractErrorMessage(content);

      expect(result).toBe("{}");
    });
  });
});

describe("TamboMcpProvider server list changes", () => {
  beforeEach(() => {
    // Mock registry so tool registration is a no-op
    (useTamboRegistry as unknown as jest.Mock).mockReturnValue({
      registerTool: jest.fn(),
    });

    // Mock client with baseURL
    (useTamboClient as unknown as jest.Mock).mockReturnValue({
      baseURL: "https://api.tambo.co",
    });

    // Ensure MCPClient.create exists and returns a fake client with listTools
    (MCPClient as unknown as any).create = jest
      .fn()
      .mockResolvedValue({ listTools: jest.fn().mockResolvedValue([]) });
  });

  const Capture: React.FC<{ onUpdate: (servers: McpServer[]) => void }> = ({
    onUpdate,
  }) => {
    const servers = useTamboMcpServers();
    useEffect(() => {
      onUpdate(servers);
    }, [servers, onUpdate]);
    return <div data-testid="urls">{servers.map((s) => s.url).join(",")}</div>;
  };

  it("adds a new server when the list grows", async () => {
    let latest: McpServer[] = [];
    const { rerender, getByTestId } = render(
      <TamboMcpTokenProvider>
        <TamboMcpProvider mcpServers={["https://a.example"]}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    // Wait for initial connection
    await waitFor(() => {
      expect(latest.length).toBe(1);
    });

    // Add new server
    rerender(
      <TamboMcpTokenProvider>
        <TamboMcpProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://a.example");
      expect(urls).toContain("https://b.example");
    });
  });

  it("removes a server when the list shrinks", async () => {
    let latest: McpServer[] = [];
    const { rerender, getByTestId } = render(
      <TamboMcpTokenProvider>
        <TamboMcpProvider
          mcpServers={["https://a.example", "https://b.example"]}
        >
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    // Remove one server
    rerender(
      <TamboMcpTokenProvider>
        <TamboMcpProvider mcpServers={["https://a.example"]}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://a.example");
      expect(urls).not.toContain("https://b.example");
    });
  });

  it("does not duplicate when a new copy of the same list is passed", async () => {
    let latest: McpServer[] = [];
    const initial = [
      { url: "https://a.example", transport: MCPTransport.SSE },
      { url: "https://b.example", transport: MCPTransport.SSE },
    ];

    const { rerender } = render(
      <TamboMcpTokenProvider>
        <TamboMcpProvider mcpServers={initial}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
    });

    // Pass a new array instance with the same logical servers
    const same = [
      { url: "https://a.example", transport: MCPTransport.SSE },
      { url: "https://b.example", transport: MCPTransport.SSE },
    ];
    rerender(
      <TamboMcpTokenProvider>
        <TamboMcpProvider mcpServers={same}>
          <Capture onUpdate={(s) => (latest = s)} />
        </TamboMcpProvider>
      </TamboMcpTokenProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(2);
      const urls = latest.map((s) => s.url).sort();
      expect(urls).toEqual(["https://a.example", "https://b.example"].sort());
    });
  });
});
