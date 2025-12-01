import { jest } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MCPClient } from "@tambo-ai-cloud/core";
import { registerPromptHandlers } from "./prompts";

// Type helpers for mocking
const _mcpClientInstance = null as unknown as MCPClient;

// Helper to create a mock MCPClient wrapper
function createMockMCPClient(
  prompts: any[],
  getPromptImpl?: jest.Mock<typeof _mcpClientInstance.client.getPrompt>,
) {
  const mockListPrompts = jest
    .fn<typeof _mcpClientInstance.client.listPrompts>()
    .mockResolvedValue({
      prompts: prompts,
    });

  const mockGetPrompt =
    getPromptImpl ??
    jest.fn<typeof _mcpClientInstance.client.getPrompt>().mockResolvedValue({
      messages: [
        { role: "user", content: { type: "text", text: "Mock response" } },
      ],
    });

  return {
    client: {
      client: {
        listPrompts: mockListPrompts,
        getPrompt: mockGetPrompt,
      },
    } as unknown as MCPClient,
    serverId: "test-server-id",
    serverKey: "test",
    url: "http://test.example.com",
  };
}

describe("registerPromptHandlers", () => {
  let mockServer: McpServer;
  let registerPromptSpy: jest.SpiedFunction<typeof mockServer.registerPrompt>;

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
          prompts: {},
        },
      },
    );

    // Spy on registerPrompt to verify what gets registered
    registerPromptSpy = jest.spyOn(mockServer, "registerPrompt");
  });

  afterEach(() => {
    registerPromptSpy.mockRestore();
  });

  describe("prompt registration", () => {
    it("should register all prompts from all clients", async () => {
      // Create mock clients with different prompts
      const mockClient1 = createMockMCPClient([
        {
          name: "client1_prompt1",
          title: "Client 1 Prompt 1",
          description: "First prompt from client 1",
          arguments: [{ name: "message", type: "string", required: true }],
        },
        {
          name: "client1_prompt2",
          title: "Client 1 Prompt 2",
          description: "Second prompt from client 1",
          arguments: [{ name: "count", type: "number", required: false }],
        },
      ]);

      const mockClient2 = createMockMCPClient([
        {
          name: "client2_prompt1",
          title: "Client 2 Prompt 1",
          description: "First prompt from client 2",
          arguments: [{ name: "query", type: "string", required: true }],
        },
      ]);

      await registerPromptHandlers(mockServer, [mockClient1, mockClient2]);

      // Verify that listPrompts was called on both clients
      expect(mockClient1.client.client.listPrompts).toHaveBeenCalledTimes(1);
      expect(mockClient2.client.client.listPrompts).toHaveBeenCalledTimes(1);

      // Verify registerPrompt was called 3 times (2 from client1, 1 from client2)
      expect(registerPromptSpy).toHaveBeenCalledTimes(3);

      // Verify specific prompts were registered with correct metadata
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:client1_prompt1",
        expect.objectContaining({
          title: "Client 1 Prompt 1",
          description: "First prompt from client 1",
        }),
        expect.any(Function),
      );

      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:client1_prompt2",
        expect.objectContaining({
          title: "Client 1 Prompt 2",
        }),
        expect.any(Function),
      );

      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:client2_prompt1",
        expect.objectContaining({
          title: "Client 2 Prompt 1",
        }),
        expect.any(Function),
      );
    });

    it("should preserve prompt metadata (title, description, arguments)", async () => {
      const mockClient = createMockMCPClient([
        {
          name: "test_prompt",
          title: "Test Prompt Title",
          description: "A detailed description of the test prompt",
          arguments: [
            {
              name: "arg1",
              type: "string",
              description: "First argument",
              required: true,
            },
            {
              name: "arg2",
              type: "number",
              description: "Second argument",
              required: false,
            },
          ],
        },
      ]);

      await registerPromptHandlers(mockServer, [mockClient]);

      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:test_prompt",
        {
          title: "Test Prompt Title",
          description: "A detailed description of the test prompt",
          argsSchema: expect.objectContaining({
            arg1: expect.any(Object), // Zod schema
            arg2: expect.any(Object), // Zod schema
          }),
        },
        expect.any(Function),
      );
    });

    it("should handle clients with no prompts", async () => {
      const mockClientWithPrompts = createMockMCPClient([
        {
          name: "only_prompt",
          title: "Only Prompt",
          description: "The only prompt",
          arguments: [],
        },
      ]);

      const mockClientWithoutPrompts = createMockMCPClient([]);

      await registerPromptHandlers(mockServer, [
        mockClientWithPrompts,
        mockClientWithoutPrompts,
      ]);

      // Only 1 prompt should be registered (from the first client)
      expect(registerPromptSpy).toHaveBeenCalledTimes(1);
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:only_prompt",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should handle empty client list", async () => {
      await registerPromptHandlers(mockServer, []);

      // No prompts should be registered
      expect(registerPromptSpy).not.toHaveBeenCalled();
    });
  });

  describe("prompt execution", () => {
    it("should route prompt calls to the correct client with arguments", async () => {
      const mockGetPrompt1 = jest
        .fn<typeof _mcpClientInstance.client.getPrompt>()
        .mockResolvedValue({
          messages: [
            {
              role: "user",
              content: { type: "text", text: "Response from client 1" },
            },
          ],
        });

      const mockGetPrompt2 = jest
        .fn<typeof _mcpClientInstance.client.getPrompt>()
        .mockResolvedValue({
          messages: [
            {
              role: "user",
              content: { type: "text", text: "Response from client 2" },
            },
          ],
        });

      const mockClient1 = createMockMCPClient(
        [
          {
            name: "client1_prompt",
            title: "Client 1 Prompt",
            arguments: [{ name: "message", type: "string", required: true }],
          },
        ],
        mockGetPrompt1,
      );

      const mockClient2 = createMockMCPClient(
        [
          {
            name: "client2_prompt",
            title: "Client 2 Prompt",
            arguments: [{ name: "query", type: "string", required: true }],
          },
        ],
        mockGetPrompt2,
      );

      await registerPromptHandlers(mockServer, [mockClient1, mockClient2]);

      // Extract the handler functions that were registered
      const client1Handler = registerPromptSpy.mock.calls.find(
        (call) => call[0] === "test:client1_prompt",
      )?.[2];
      const client2Handler = registerPromptSpy.mock.calls.find(
        (call) => call[0] === "test:client2_prompt",
      )?.[2];

      expect(client1Handler).toBeDefined();
      expect(client2Handler).toBeDefined();

      // Call the first client's prompt handler with arguments
      const args1 = { message: "Hello from test" };
      const result1 = await client1Handler!(args1, {} as any);

      // Verify the correct client's getPrompt was called with correct args
      expect(mockGetPrompt1).toHaveBeenCalledWith({
        name: "client1_prompt",
        arguments: args1,
      });
      expect(mockGetPrompt2).not.toHaveBeenCalled();
      expect(result1.messages[0].content).toEqual({
        type: "text",
        text: "Response from client 1",
      });

      // Reset mocks
      mockGetPrompt1.mockClear();
      mockGetPrompt2.mockClear();

      // Call the second client's prompt handler
      const args2 = { query: "search term" };
      const result2 = await client2Handler!(args2, {} as any);

      expect(mockGetPrompt2).toHaveBeenCalledWith({
        name: "client2_prompt",
        arguments: args2,
      });
      expect(mockGetPrompt1).not.toHaveBeenCalled();
      expect(result2.messages[0].content).toEqual({
        type: "text",
        text: "Response from client 2",
      });
    });

    it("should pass arguments correctly to the underlying client", async () => {
      const mockGetPrompt = jest
        .fn<typeof _mcpClientInstance.client.getPrompt>()
        .mockResolvedValue({
          messages: [
            { role: "user", content: { type: "text", text: "Response" } },
          ],
        });

      const mockClient = createMockMCPClient(
        [
          {
            name: "test_prompt",
            title: "Test Prompt",
            arguments: [
              { name: "message", type: "string", required: true },
              { name: "count", type: "number", required: true },
            ],
          },
        ],
        mockGetPrompt,
      );

      await registerPromptHandlers(mockServer, [mockClient]);

      const handler = registerPromptSpy.mock.calls[0][2];
      const args = { message: "hello", count: 42 };

      await handler(args as any, {} as any);

      expect(mockGetPrompt).toHaveBeenCalledWith({
        name: "test_prompt",
        arguments: args,
      });
    });

    it("should propagate errors from getPrompt when handler is invoked", async () => {
      const mockGetPrompt = jest
        .fn<typeof _mcpClientInstance.client.getPrompt>()
        .mockRejectedValue(new Error("Prompt execution failed"));

      const mockClient = createMockMCPClient(
        [
          {
            name: "failing_prompt",
            title: "Failing Prompt",
            arguments: [],
          },
        ],
        mockGetPrompt,
      );

      await registerPromptHandlers(mockServer, [mockClient]);

      const handler = registerPromptSpy.mock.calls[0][2];

      // The error should propagate to the caller
      await expect(handler({}, {} as any)).rejects.toThrow(
        "Prompt execution failed",
      );
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

    it("should continue registering prompts when one client fails", async () => {
      const failingClient = {
        client: {
          client: {
            listPrompts: jest
              .fn<typeof _mcpClientInstance.client.listPrompts>()
              .mockRejectedValue(new Error("Client connection failed")),
          },
        } as unknown as MCPClient,
        serverId: "failing-server",
        serverKey: "failing",
        url: "http://failing.example.com",
      };

      const workingClient = createMockMCPClient([
        {
          name: "working_prompt",
          title: "Working Prompt",
          arguments: [],
        },
      ]);

      await registerPromptHandlers(mockServer, [failingClient, workingClient]);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing prompts for MCP server",
        "failing-server",
        expect.any(Error),
      );

      // Verify the working client's prompt was still registered
      expect(registerPromptSpy).toHaveBeenCalledTimes(1);
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:working_prompt",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should log errors for all failing clients", async () => {
      const failingClient1 = {
        client: {
          client: {
            listPrompts: jest
              .fn<typeof _mcpClientInstance.client.listPrompts>()
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
            listPrompts: jest
              .fn<typeof _mcpClientInstance.client.listPrompts>()
              .mockRejectedValue(new Error("Client 2 failed")),
          },
        } as unknown as MCPClient,
        serverId: "failing-server-2",
        serverKey: "failing2",
        url: "http://failing2.example.com",
      };

      await registerPromptHandlers(mockServer, [
        failingClient1,
        failingClient2,
      ]);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing prompts for MCP server",
        "failing-server-1",
        expect.objectContaining({ message: "Client 1 failed" }),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing prompts for MCP server",
        "failing-server-2",
        expect.objectContaining({ message: "Client 2 failed" }),
      );
    });
  });

  describe("multiple prompts", () => {
    it("should handle multiple prompts from a single client", async () => {
      const mockClient = createMockMCPClient([
        {
          name: "prompt1",
          title: "Prompt 1",
          arguments: [],
        },
        {
          name: "prompt2",
          title: "Prompt 2",
          arguments: [],
        },
      ]);

      await registerPromptHandlers(mockServer, [mockClient]);

      // Both prompts should be registered
      expect(registerPromptSpy).toHaveBeenCalledTimes(2);
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:prompt1",
        expect.any(Object),
        expect.any(Function),
      );
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:prompt2",
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("edge cases", () => {
    it("should handle prompts with minimal metadata", async () => {
      const mockClient = createMockMCPClient([
        {
          name: "minimal_prompt",
          // No title, description, or arguments - only name is required
        },
      ]);

      await registerPromptHandlers(mockServer, [mockClient]);

      expect(registerPromptSpy).toHaveBeenCalledTimes(1);
      // Verify that minimal metadata gets defaults
      expect(registerPromptSpy).toHaveBeenCalledWith(
        "test:minimal_prompt",
        {
          title: "minimal_prompt", // Defaults to name
          description: undefined,
          argsSchema: {}, // Empty object when no arguments
        },
        expect.any(Function),
      );
    });

    it("should handle prompts that return multiple messages", async () => {
      const mockGetPrompt = jest
        .fn<typeof _mcpClientInstance.client.getPrompt>()
        .mockResolvedValue({
          messages: [
            { role: "user", content: { type: "text", text: "First message" } },
            {
              role: "assistant",
              content: { type: "text", text: "Second message" },
            },
            { role: "user", content: { type: "text", text: "Third message" } },
          ],
        });

      const mockClient = createMockMCPClient(
        [
          {
            name: "multi_message_prompt",
            title: "Multi Message Prompt",
            arguments: [],
          },
        ],
        mockGetPrompt,
      );

      await registerPromptHandlers(mockServer, [mockClient]);

      const handler = registerPromptSpy.mock.calls[0][2];
      const result = await handler({}, {} as any);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].content).toEqual({
        type: "text",
        text: "First message",
      });
      expect(result.messages[1].content).toEqual({
        type: "text",
        text: "Second message",
      });
      expect(result.messages[2].content).toEqual({
        type: "text",
        text: "Third message",
      });
    });
  });
});
