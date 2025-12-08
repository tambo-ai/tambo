import { jest } from "@jest/globals";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  ElicitRequest,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { MCPHandlers } from "@tambo-ai-cloud/core";
import type { ThreadMcpClient } from "./elicitations";
import { registerElicitationHandlers } from "./elicitations";

describe("registerElicitationHandlers", () => {
  const elicitResult: ElicitResult = {
    action: "accept",
    content: {
      response: "ok",
    },
  };

  function createServerMock() {
    const elicitInput = jest.fn(
      async (_params: ElicitRequest["params"]) => elicitResult,
    );
    const server = {
      server: {
        elicitInput,
      },
    } as unknown as McpServer;

    return { server, elicitInput };
  }

  function createThreadClient(serverId: string, url: string) {
    const updateElicitationHandler = jest.fn();
    const client = {
      updateElicitationHandler,
    } as unknown as ThreadMcpClient["client"];

    return {
      threadClient: {
        client,
        serverId,
        serverKey: "test",
        url,
      },
      updateElicitationHandler,
    };
  }

  it("registers elicitation handler for each client", async () => {
    const { server, elicitInput } = createServerMock();
    const { threadClient, updateElicitationHandler } = createThreadClient(
      "server-1",
      "https://example.com",
    );

    registerElicitationHandlers(server, [threadClient]);

    expect(updateElicitationHandler).toHaveBeenCalledTimes(1);

    const handler = updateElicitationHandler.mock
      .calls[0]?.[0] as MCPHandlers["elicitation"];
    expect(typeof handler).toBe("function");

    const request: Parameters<MCPHandlers["elicitation"]>[0] = {
      method: "elicitation/create",
      params: {
        message: "Test message",
        requestedSchema: {
          type: "object",
          properties: {},
          required: [],
        },
        _meta: {
          existing: true,
        },
      },
    } satisfies ElicitRequest;

    const result = await handler(request);

    expect(result).toBe(elicitResult);
    expect(elicitInput).toHaveBeenCalledWith({
      message: "Test message",
      requestedSchema: {
        type: "object",
        properties: {},
        required: [],
      },
      _meta: {
        existing: true,
      },
    });
  });
});
