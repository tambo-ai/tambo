import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { JSONSchema7 } from "json-schema";

export enum MCPTransport {
  SSE = "sse",
  HTTP = "http",
}

export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport | StreamableHTTPClientTransport;

  private constructor(
    endpoint: string,
    transport: MCPTransport,
    headers?: Record<string, string>,
  ) {
    if (transport === MCPTransport.SSE) {
      this.transport = new SSEClientTransport(new URL(endpoint), {
        requestInit: { headers },
      });
    } else {
      this.transport = new StreamableHTTPClientTransport(new URL(endpoint), {
        requestInit: { headers },
      });
    }
    this.client = new Client({ name: "tambo-mcp-client", version: "1.0.0" });
  }

  static async create(
    endpoint: string,
    transport: MCPTransport = MCPTransport.HTTP,
    headers?: Record<string, string>,
  ): Promise<MCPClient> {
    const mcpClient = new MCPClient(endpoint, transport, headers);
    await mcpClient.client.connect(mcpClient.transport);
    return mcpClient;
  }

  async listTools(): Promise<MCPToolSpec[]> {
    const allTools: MCPToolSpec[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;
    while (hasMore) {
      const response = await this.client.listTools({ cursor }, {});
      allTools.push(
        ...response.tools.map((tool): MCPToolSpec => {
          if (tool.inputSchema.type !== "object") {
            throw new Error(
              `Input schema for tool ${tool.name} is not an object`,
            );
          }
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as JSONSchema7,
          };
        }),
      );
      if (response.nextCursor) {
        cursor = response.nextCursor;
      } else {
        hasMore = false;
      }
    }
    return allTools;
  }

  async callTool(name: string, args: Record<string, unknown>) {
    const result = await this.client.callTool({ name, arguments: args });
    return result;
  }
}

export interface MCPToolSpec {
  name: string;
  description?: string;
  inputSchema?: JSONSchema7;
}

