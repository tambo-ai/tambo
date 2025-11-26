import { jest } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MCPClient } from "@tambo-ai-cloud/core";
import { registerResourceHandlers } from "./resources";

// Type helpers for mocking
const _mcpClientInstance = null as unknown as MCPClient;

// Helper to create a mock MCPClient wrapper
function createMockMCPClient(
  resources: any[],
  readResourceImpl?: jest.Mock<typeof _mcpClientInstance.client.readResource>,
) {
  const mockListResources = jest
    .fn<typeof _mcpClientInstance.client.listResources>()
    .mockResolvedValue({
      resources: resources,
    });

  const mockReadResource =
    readResourceImpl ??
    jest.fn<typeof _mcpClientInstance.client.readResource>().mockResolvedValue({
      contents: [
        {
          uri: "resource://test",
          mimeType: "text/plain",
          text: "Mock content",
        },
      ],
    });

  return {
    client: {
      client: {
        listResources: mockListResources,
        readResource: mockReadResource,
      },
    } as unknown as MCPClient,
    serverId: "test-server-id",
    serverKey: "test",
    url: "http://test.example.com",
  };
}

describe("registerResourceHandlers", () => {
  let mockServer: McpServer;
  let registerResourceSpy: jest.SpiedFunction<
    typeof mockServer.registerResource
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a real McpServer instance for testing
    mockServer = new McpServer(
      {
        name: "test-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
        },
      },
    );

    // Spy on registerResource to verify what gets registered
    registerResourceSpy = jest.spyOn(mockServer, "registerResource");
  });

  afterEach(() => {
    registerResourceSpy.mockRestore();
  });

  describe("resource registration", () => {
    it("should register all resources from all clients", async () => {
      // Create mock clients with different resources
      const mockClient1 = createMockMCPClient([
        {
          uri: "file://doc1.txt",
          name: "doc1",
          mimeType: "text/plain",
          description: "First document",
        },
        {
          uri: "file://doc2.txt",
          name: "doc2",
          mimeType: "text/plain",
          description: "Second document",
        },
      ]);

      const mockClient2 = createMockMCPClient([
        {
          uri: "file://doc3.txt",
          name: "doc3",
          mimeType: "text/plain",
          description: "Third document",
        },
      ]);

      await registerResourceHandlers(mockServer, [mockClient1, mockClient2]);

      // Verify that listResources was called on both clients
      expect(mockClient1.client.client.listResources).toHaveBeenCalledTimes(1);
      expect(mockClient2.client.client.listResources).toHaveBeenCalledTimes(1);

      // Verify registerResource was called 3 times (2 from client1, 1 from client2)
      expect(registerResourceSpy).toHaveBeenCalledTimes(3);

      // Verify specific resources were registered with correct metadata
      // Note: names stay as-is, URIs get serverKey prefix
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "doc1",
        "test:file://doc1.txt",
        expect.objectContaining({
          description: "First document",
        }),
        expect.any(Function),
      );

      expect(registerResourceSpy).toHaveBeenCalledWith(
        "doc2",
        "test:file://doc2.txt",
        expect.any(Object),
        expect.any(Function),
      );

      expect(registerResourceSpy).toHaveBeenCalledWith(
        "doc3",
        "test:file://doc3.txt",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should preserve resource metadata (uri, name, description, mimeType)", async () => {
      const mockClient = createMockMCPClient([
        {
          uri: "file://data.json",
          name: "data_resource",
          mimeType: "application/json",
          description: "A JSON data resource",
        },
      ]);

      await registerResourceHandlers(mockServer, [mockClient]);

      expect(registerResourceSpy).toHaveBeenCalledWith(
        "data_resource",
        "test:file://data.json",
        {
          description: "A JSON data resource",
          mimeType: "application/json",
        },
        expect.any(Function),
      );
    });

    it("should handle clients with no resources", async () => {
      const mockClientWithResources = createMockMCPClient([
        {
          uri: "file://resource.txt",
          name: "resource",
          mimeType: "text/plain",
        },
      ]);

      const mockClientWithoutResources = createMockMCPClient([]);

      await registerResourceHandlers(mockServer, [
        mockClientWithResources,
        mockClientWithoutResources,
      ]);

      // Only 1 resource should be registered (from the first client)
      expect(registerResourceSpy).toHaveBeenCalledTimes(1);
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "resource",
        expect.stringContaining("test:"),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should handle empty client list", async () => {
      await registerResourceHandlers(mockServer, []);

      // No resources should be registered
      expect(registerResourceSpy).not.toHaveBeenCalled();
    });
  });

  describe("resource execution", () => {
    it("should route resource calls to the correct client", async () => {
      const mockReadResource1 = jest
        .fn<typeof _mcpClientInstance.client.readResource>()
        .mockResolvedValue({
          contents: [
            {
              uri: "file://doc1.txt",
              mimeType: "text/plain",
              text: "Content from client 1",
            },
          ],
        });

      const mockReadResource2 = jest
        .fn<typeof _mcpClientInstance.client.readResource>()
        .mockResolvedValue({
          contents: [
            {
              uri: "file://doc2.txt",
              mimeType: "text/plain",
              text: "Content from client 2",
            },
          ],
        });

      const mockClient1 = createMockMCPClient(
        [
          {
            uri: "file://doc1.txt",
            name: "doc1",
            mimeType: "text/plain",
          },
        ],
        mockReadResource1,
      );

      const mockClient2 = createMockMCPClient(
        [
          {
            uri: "file://doc2.txt",
            name: "doc2",
            mimeType: "text/plain",
          },
        ],
        mockReadResource2,
      );

      await registerResourceHandlers(mockServer, [mockClient1, mockClient2]);

      // Extract the handler functions that were registered (4th argument, index 3)
      // Note: resource names are NOT prefixed, only URIs are
      const client1Handler = registerResourceSpy.mock.calls.find(
        (call) => call[0] === "doc1",
      )?.[3];
      const client2Handler = registerResourceSpy.mock.calls.find(
        (call) => call[0] === "doc2",
      )?.[3];

      expect(client1Handler).toBeDefined();
      expect(client2Handler).toBeDefined();

      // Call the first client's resource handler
      const uri1 = new URL("file://doc1.txt");
      const result1 = await (client1Handler as any)(uri1, {} as any);

      // Verify the correct client's readResource was called (uri is converted to string)
      expect(mockReadResource1).toHaveBeenCalledWith({ uri: uri1.toString() });
      expect(mockReadResource2).not.toHaveBeenCalled();
      expect(result1.contents[0].text).toEqual("Content from client 1");

      // Reset mocks
      mockReadResource1.mockClear();
      mockReadResource2.mockClear();

      // Call the second client's resource handler
      const uri2 = new URL("file://doc2.txt");
      const result2 = await (client2Handler as any)(uri2, {} as any);

      expect(mockReadResource2).toHaveBeenCalledWith({ uri: uri2.toString() });
      expect(mockReadResource1).not.toHaveBeenCalled();
      expect(result2.contents[0].text).toEqual("Content from client 2");
    });

    it("should pass URI correctly to the underlying client", async () => {
      const mockReadResource = jest
        .fn<typeof _mcpClientInstance.client.readResource>()
        .mockResolvedValue({
          contents: [
            {
              uri: "file://test.txt",
              mimeType: "text/plain",
              text: "Test content",
            },
          ],
        });

      const mockClient = createMockMCPClient(
        [
          {
            uri: "file://test.txt",
            name: "test_resource",
            mimeType: "text/plain",
          },
        ],
        mockReadResource,
      );

      await registerResourceHandlers(mockServer, [mockClient]);

      const handler = registerResourceSpy.mock.calls[0][3] as any;
      const testUri = new URL("file://test.txt");

      await handler(testUri, {} as any);

      expect(mockReadResource).toHaveBeenCalledWith({
        uri: testUri.toString(),
      });
    });

    it("should propagate errors from readResource when handler is invoked", async () => {
      const mockReadResource = jest
        .fn<typeof _mcpClientInstance.client.readResource>()
        .mockRejectedValue(new Error("Resource read failed"));

      const mockClient = createMockMCPClient(
        [
          {
            uri: "file://failing.txt",
            name: "failing_resource",
            mimeType: "text/plain",
          },
        ],
        mockReadResource,
      );

      await registerResourceHandlers(mockServer, [mockClient]);

      const handler = registerResourceSpy.mock.calls[0][3] as any;

      // The error should propagate to the caller
      await expect(
        handler(new URL("file://failing.txt"), {} as any),
      ).rejects.toThrow("Resource read failed");
    });
  });

  describe("error handling", () => {
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should continue registering resources when one client fails", async () => {
      const failingClient = {
        client: {
          client: {
            listResources: jest
              .fn<typeof _mcpClientInstance.client.listResources>()
              .mockRejectedValue(new Error("Client connection failed")),
          },
        } as unknown as MCPClient,
        serverId: "failing-server",
        serverKey: "failing",
        url: "http://failing.example.com",
      };

      const workingClient = createMockMCPClient([
        {
          uri: "file://working.txt",
          name: "working_resource",
          mimeType: "text/plain",
        },
      ]);

      await registerResourceHandlers(mockServer, [
        failingClient,
        workingClient,
      ]);

      // Verify error was logged with serverId, url, and the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing resources for MCP server",
        "failing-server",
        "http://failing.example.com",
        expect.any(Error),
      );

      // Verify the working client's resource was still registered
      expect(registerResourceSpy).toHaveBeenCalledTimes(1);
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "working_resource",
        expect.stringContaining("test:"),
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should log errors for all failing clients", async () => {
      const failingClient1 = {
        client: {
          client: {
            listResources: jest
              .fn<typeof _mcpClientInstance.client.listResources>()
              .mockRejectedValue(new Error("Client 1 failed")),
          },
        } as unknown as MCPClient,
        serverId: "failing-server-1",
        serverKey: "failing1",
        url: "http://failing1.example.com",
      };

      const failingClient2 = {
        client: {
          client: {
            listResources: jest
              .fn<typeof _mcpClientInstance.client.listResources>()
              .mockRejectedValue(new Error("Client 2 failed")),
          },
        } as unknown as MCPClient,
        serverId: "failing-server-2",
        serverKey: "failing2",
        url: "http://failing2.example.com",
      };

      await registerResourceHandlers(mockServer, [
        failingClient1,
        failingClient2,
      ]);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing resources for MCP server",
        "failing-server-1",
        "http://failing1.example.com",
        expect.objectContaining({ message: "Client 1 failed" }),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing resources for MCP server",
        "failing-server-2",
        "http://failing2.example.com",
        expect.objectContaining({ message: "Client 2 failed" }),
      );
    });
  });

  describe("multiple resources", () => {
    it("should handle multiple resources from a single client", async () => {
      const mockClient = createMockMCPClient([
        {
          uri: "file://resource1.txt",
          name: "resource1",
          mimeType: "text/plain",
        },
        {
          uri: "file://resource2.txt",
          name: "resource2",
          mimeType: "text/plain",
        },
      ]);

      await registerResourceHandlers(mockServer, [mockClient]);

      // Both resources should be registered
      expect(registerResourceSpy).toHaveBeenCalledTimes(2);
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "resource1",
        expect.stringContaining("test:"),
        expect.any(Object),
        expect.any(Function),
      );
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "resource2",
        expect.stringContaining("test:"),
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("static URIs", () => {
    it("should only register resources with static URIs", async () => {
      const mockClient = createMockMCPClient([
        {
          uri: "file://document1.txt",
          name: "document1",
          description: "First document",
        },
        {
          // This resource has no URI, should be skipped
          uri: undefined,
          name: "no_uri_resource",
          description: "A resource without a URI",
        },
      ]);

      let warnCalled = false;
      const originalWarn = console.warn;
      console.warn = () => {
        warnCalled = true;
      };

      await registerResourceHandlers(mockServer, [mockClient]);

      console.warn = originalWarn;

      // Only 1 resource should be registered (the one with a URI)
      expect(registerResourceSpy).toHaveBeenCalledTimes(1);
      expect(registerResourceSpy).toHaveBeenCalledWith(
        "document1",
        "test:file://document1.txt",
        expect.any(Object),
        expect.any(Function),
      );
      expect(warnCalled).toBe(true);
    });
  });

  describe("serverKey prefixing", () => {
    it("should prefix resource URIs with serverKey when provided", async () => {
      const mockClient = createMockMCPClient([
        {
          uri: "file://data.json",
          name: "data",
          mimeType: "application/json",
        },
      ]);
      mockClient.serverKey = "github";

      await registerResourceHandlers(mockServer, [mockClient]);

      expect(registerResourceSpy).toHaveBeenCalledWith(
        "data",
        "github:file://data.json",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should not prefix resource URIs when serverKey is empty", async () => {
      const mockClient = createMockMCPClient([
        {
          uri: "file://data.json",
          name: "data",
          mimeType: "application/json",
        },
      ]);
      mockClient.serverKey = "";

      await registerResourceHandlers(mockServer, [mockClient]);

      expect(registerResourceSpy).toHaveBeenCalledWith(
        "data",
        "file://data.json",
        expect.any(Object),
        expect.any(Function),
      );
    });
  });
});
