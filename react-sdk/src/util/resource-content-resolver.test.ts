import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { ServerType } from "../mcp/mcp-constants";
import type { McpServer } from "../mcp/tambo-mcp-provider";
import type { ResourceSource } from "../model/resource-info";
import { MCPTransport } from "../mcp/mcp-client";

import {
  resolveResourceContents,
  extractResourceUris,
} from "./resource-content-resolver";

describe("extractResourceUris", () => {
  it("should extract a single resource URI", () => {
    const text = "Check @registry:file:///path/to/doc.txt";
    const result = extractResourceUris(text);
    expect(result).toEqual(["registry:file:///path/to/doc.txt"]);
  });

  it("should extract multiple resource URIs", () => {
    const text =
      "Check @registry:file:///doc1.txt and @server-a:file:///doc2.txt";
    const result = extractResourceUris(text);
    expect(result).toEqual([
      "registry:file:///doc1.txt",
      "server-a:file:///doc2.txt",
    ]);
  });

  it("should extract resource URIs with internal server prefix", () => {
    const text = "Check @tambo-abc123:tambo:test://resource/1";
    const result = extractResourceUris(text);
    expect(result).toEqual(["tambo-abc123:tambo:test://resource/1"]);
  });

  it("should extract resource URIs with hyphens in server key", () => {
    const text = "@my-mcp-server:file:///path/file.txt";
    const result = extractResourceUris(text);
    expect(result).toEqual(["my-mcp-server:file:///path/file.txt"]);
  });

  it("should return empty array for text without resource references", () => {
    const text = "Just some regular text without @mentions";
    const result = extractResourceUris(text);
    expect(result).toEqual([]);
  });

  it("should not extract malformed references without colon", () => {
    const text = "@server-without-colon is not a resource";
    const result = extractResourceUris(text);
    expect(result).toEqual([]);
  });

  it("should handle URIs with multiple colons", () => {
    const text = "@server:http://example.com:8080/path";
    const result = extractResourceUris(text);
    expect(result).toEqual(["server:http://example.com:8080/path"]);
  });
});

describe("resolveResourceContents", () => {
  const createMockConnectedServer = (
    serverKey: string,
    readResource: jest.Mock,
    serverType: ServerType = ServerType.BROWSER_SIDE,
  ): McpServer =>
    ({
      key: `mcp-${serverKey}`,
      serverKey,
      url: `https://${serverKey}.example.com`,
      name: `MCP Server ${serverKey}`,
      transport: MCPTransport.HTTP,
      serverType,
      client: {
        client: {
          readResource,
          listResources: jest.fn().mockResolvedValue({ resources: [] }),
          listTools: jest.fn().mockResolvedValue({ tools: [] }),
          listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
          getPrompt: jest.fn().mockResolvedValue(null),
          callTool: jest.fn().mockResolvedValue(null),
        },
        close: jest.fn().mockResolvedValue(undefined),
      } as unknown as McpServer["client"],
    }) as McpServer;

  const createMockInternalServer = (serverKey: string): McpServer =>
    ({
      key: serverKey,
      serverKey,
      url: "https://api.tambo.ai/mcp",
      name: "__tambo_internal_mcp_server__",
      transport: MCPTransport.HTTP,
      serverType: ServerType.TAMBO_INTERNAL,
      connectionError: undefined, // No client for internal servers
    }) as unknown as McpServer;

  const createMockResourceSource = (
    getResource: jest.Mock,
  ): ResourceSource => ({
    listResources: jest.fn().mockResolvedValue([]),
    getResource,
  });

  it("should resolve registry resources via resourceSource", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///local/doc.txt",
          mimeType: "text/plain",
          text: "Registry document content",
        },
      ],
    } satisfies ReadResourceResult);

    const resourceSource = createMockResourceSource(mockGetResource);

    const result = await resolveResourceContents(
      ["registry:file:///local/doc.txt"],
      [], // Registry resources don't need a server - they're handled directly
      resourceSource,
    );

    expect(mockGetResource).toHaveBeenCalledWith("file:///local/doc.txt");
    expect(result.size).toBe(1);
    expect(result.get("registry:file:///local/doc.txt")).toEqual({
      contents: [
        {
          uri: "file:///local/doc.txt",
          mimeType: "text/plain",
          text: "Registry document content",
        },
      ],
    });
  });

  it("should resolve client-side MCP resources via mcpServer", async () => {
    const mockReadResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///mcp/file.txt",
          mimeType: "text/plain",
          text: "MCP server content",
        },
      ],
    } satisfies ReadResourceResult);

    const mcpServer = createMockConnectedServer("linear", mockReadResource);

    const result = await resolveResourceContents(
      ["linear:file:///mcp/file.txt"],
      [mcpServer],
      undefined,
    );

    expect(mockReadResource).toHaveBeenCalledWith({
      uri: "file:///mcp/file.txt",
    });
    expect(result.size).toBe(1);
    expect(result.get("linear:file:///mcp/file.txt")).toEqual({
      contents: [
        {
          uri: "file:///mcp/file.txt",
          mimeType: "text/plain",
          text: "MCP server content",
        },
      ],
    });
  });

  it("should skip internal server resources (serverType: TAMBO_INTERNAL)", async () => {
    const mockGetResource = jest.fn();
    const resourceSource = createMockResourceSource(mockGetResource);
    const internalServer = createMockInternalServer("tambo-abc123");

    const result = await resolveResourceContents(
      ["tambo-abc123:tambo:test://resource/1"],
      [internalServer],
      resourceSource,
    );

    // Should not call getResource for internal server resources
    expect(mockGetResource).not.toHaveBeenCalled();
    // Should return empty map since internal resources are skipped
    expect(result.size).toBe(0);
  });

  it("should resolve multiple resources in parallel", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "file:///doc.txt", text: "registry content" }],
    });
    const mockReadResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "file:///mcp.txt", text: "mcp content" }],
    });

    const resourceSource = createMockResourceSource(mockGetResource);
    const mcpServer = createMockConnectedServer("mcp-server", mockReadResource);

    const result = await resolveResourceContents(
      ["registry:file:///doc.txt", "mcp-server:file:///mcp.txt"],
      [mcpServer], // Only MCP server needed - registry handled directly
      resourceSource,
    );

    expect(result.size).toBe(2);
    expect(result.has("registry:file:///doc.txt")).toBe(true);
    expect(result.has("mcp-server:file:///mcp.txt")).toBe(true);
  });

  it("should handle mixed internal and client-side resources", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "file:///doc.txt", text: "registry content" }],
    });
    const resourceSource = createMockResourceSource(mockGetResource);
    const internalServer = createMockInternalServer("tambo-abc123");

    const result = await resolveResourceContents(
      [
        "registry:file:///doc.txt", // client-side registry
        "tambo-abc123:tambo:test://resource/1", // internal - should skip
      ],
      [internalServer], // Only internal server needed - registry handled directly
      resourceSource,
    );

    // Only the registry resource should be resolved
    expect(mockGetResource).toHaveBeenCalledTimes(1);
    expect(result.size).toBe(1);
    expect(result.has("registry:file:///doc.txt")).toBe(true);
    expect(result.has("tambo-abc123:tambo:test://resource/1")).toBe(false);
  });

  it("should gracefully handle registry resource fetch failure", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const mockGetResource = jest
      .fn()
      .mockRejectedValue(new Error("Resource not found"));
    const resourceSource = createMockResourceSource(mockGetResource);

    const result = await resolveResourceContents(
      ["registry:file:///missing.txt"],
      [], // Registry resources don't need a server
      resourceSource,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch resource content for registry:file:///missing.txt:",
      expect.any(Error),
    );
    expect(result.size).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should gracefully handle MCP resource fetch failure", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const mockReadResource = jest
      .fn()
      .mockRejectedValue(new Error("MCP server error"));
    const mcpServer = createMockConnectedServer("linear", mockReadResource);

    const result = await resolveResourceContents(
      ["linear:file:///missing.txt"],
      [mcpServer],
      undefined,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch resource content for linear:file:///missing.txt:",
      expect.any(Error),
    );
    expect(result.size).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should warn when no resourceSource available for registry resource", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const result = await resolveResourceContents(
      ["registry:file:///doc.txt"],
      [], // Registry resources don't need a server
      undefined, // no resourceSource
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "No resource source available to resolve registry resource: registry:file:///doc.txt",
    );
    expect(result.size).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should warn when no server found for resource", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const result = await resolveResourceContents(
      ["unknown-server:file:///doc.txt"],
      [], // no servers
      undefined,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "No server found for resource: unknown-server:file:///doc.txt",
    );
    expect(result.size).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should handle resource content with blob data", async () => {
    const mockGetResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: "file:///image.png",
          mimeType: "image/png",
          blob: "base64encodeddata",
        },
      ],
    } satisfies ReadResourceResult);

    const resourceSource = createMockResourceSource(mockGetResource);

    const result = await resolveResourceContents(
      ["registry:file:///image.png"],
      [], // Registry resources don't need a server
      resourceSource,
    );

    expect(result.get("registry:file:///image.png")).toEqual({
      contents: [
        {
          uri: "file:///image.png",
          mimeType: "image/png",
          blob: "base64encodeddata",
        },
      ],
    });
  });

  it("should handle URIs with no colon (invalid format)", async () => {
    const result = await resolveResourceContents(
      ["invalid-uri-no-colon"],
      [],
      undefined,
    );

    expect(result.size).toBe(0);
  });

  it("should handle null content from getResource", async () => {
    const mockGetResource = jest.fn().mockResolvedValue(null);
    const resourceSource = createMockResourceSource(mockGetResource);

    const result = await resolveResourceContents(
      ["registry:file:///doc.txt"],
      [], // Registry resources don't need a server
      resourceSource,
    );

    expect(mockGetResource).toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it("should handle null content from readResource", async () => {
    const mockReadResource = jest.fn().mockResolvedValue(null);
    const mcpServer = createMockConnectedServer("linear", mockReadResource);

    const result = await resolveResourceContents(
      ["linear:file:///doc.txt"],
      [mcpServer],
      undefined,
    );

    expect(mockReadResource).toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});
