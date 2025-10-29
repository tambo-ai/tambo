import { type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  CreateMessageRequest,
  CreateMessageRequestSchema,
  CreateMessageResult,
  ElicitRequest,
  ElicitRequestSchema,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import { JSONSchema7 } from "json-schema";

export enum MCPTransport {
  SSE = "sse",
  HTTP = "http",
}

/**
 * Handlers for MCP requests - these are only used if the server supports the corresponding capabilities
 * @param elicitation - Handler for elicitation requests
 * @param sampling - Handler for sampling requests
 * @example
 * ```typescript
 * const mcp = await MCPClient.create(
 *     'https://api.example.com/mcp',
 *     MCPTransport.HTTP,
 *     {},
 *     undefined,
 *     undefined,
 *     {
 *       elicitation: (e: ElicitRequest) => Promise.resolve({...}),
 *     },
 * });
 * ```
 */
export interface MCPHandlers {
  elicitation: (e: ElicitRequest) => Promise<ElicitResult>;
  sampling: (e: CreateMessageRequest) => Promise<CreateMessageResult>;
}

/**
 * A client for interacting with MCP (Model Context Protocol) servers.
 * Provides a simple interface for listing and calling tools exposed by the server.
 * @example
 * ```typescript
 * const mcp = await MCPClient.create('https://api.example.com/mcp');
 * const tools = await mcp.listTools();
 * const result = await mcp.callTool('toolName', { arg1: 'value1' });
 * ```
 */
export class MCPClient {
  /**
   * The underlying MCP client
   *
   * Be careful not to mutate the client directly, use the methods provided instead.
   */
  client: Client;
  private transport: SSEClientTransport | StreamableHTTPClientTransport;
  private transportType: MCPTransport;
  public sessionId?: string;
  private endpoint: string;
  private headers: Record<string, string>;
  private authProvider?: OAuthClientProvider;
  private handlers: Partial<MCPHandlers>;

  /**
   * Private constructor to enforce using the static create method.
   * @param endpoint - The URL of the MCP server to connect to
   * @param transportType - The transport to use for the MCP client
   * @param headers - Optional custom headers to include in requests
   */
  private constructor(
    endpoint: string,
    transportType: MCPTransport,
    headers?: Record<string, string>,
    authProvider?: OAuthClientProvider,
    sessionId?: string,
    handlers: Partial<MCPHandlers> = {},
  ) {
    this.endpoint = endpoint;
    this.headers = headers ?? {};
    this.authProvider = authProvider;
    this.transportType = transportType;
    this.handlers = handlers;
    this.transport = this.initializeTransport(sessionId);
    this.client = this.initializeClient();
  }

  /**
   * Creates and initializes a new MCPClient instance. This is the recommended
   * way to create an MCPClient as it handles both instantiation and connection
   * setup.
   * @param endpoint - The URL of the MCP server to connect to
   * @param transportType - The transport type to use for the MCP client. Defaults to HTTP.
   * @param headers - Optional custom headers to include in requests
   * @param authProvider - Optional auth provider to use for authentication
   * @param sessionId - Optional session id to use for the MCP client - if not
   *   provided, a new session will be created
   * @returns A connected MCPClient instance ready for use
   * @throws {Error} Will throw an error if connection fails
   */
  static async create(
    endpoint: string,
    transportType: MCPTransport = MCPTransport.HTTP,
    headers: Record<string, string> | undefined,
    authProvider: OAuthClientProvider | undefined,
    sessionId: string | undefined,
    handlers: Partial<MCPHandlers> = {},
  ): Promise<MCPClient> {
    const mcpClient = new MCPClient(
      endpoint,
      transportType,
      headers,
      authProvider,
      sessionId,
      handlers,
    );
    await mcpClient.client.connect(mcpClient.transport);
    if ("sessionId" in mcpClient.transport) {
      mcpClient.sessionId = mcpClient.transport.sessionId;
    }
    return mcpClient;
  }

  private initializeTransport(sessionId: string | undefined) {
    if (this.transportType === MCPTransport.SSE) {
      return new SSEClientTransport(new URL(this.endpoint), {
        authProvider: this.authProvider,
        requestInit: { headers: this.headers },
      });
    } else {
      return new StreamableHTTPClientTransport(new URL(this.endpoint), {
        authProvider: this.authProvider,
        requestInit: { headers: this.headers },
        sessionId,
      });
    }
  }

  /**
   * Initializes the MCP client with the appropriate capabilities and handlers
   * @returns The initialized MCP client
   */
  private initializeClient() {
    const elicitationCapability = this.handlers.elicitation
      ? { elicitation: {} }
      : {};
    const samplingCapability = this.handlers.sampling ? { sampling: {} } : {};
    const client = new Client(
      {
        name: "tambo-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          ...elicitationCapability,
          ...samplingCapability,
        },
      },
    );

    if (this.handlers.elicitation) {
      client.setRequestHandler(ElicitRequestSchema, this.handlers.elicitation);
    }
    if (this.handlers.sampling) {
      client.setRequestHandler(
        CreateMessageRequestSchema,
        this.handlers.sampling,
      );
    }
    return client;
  }

  /**
   * Retrieves a complete list of all available tools from the MCP server.
   * Handles pagination automatically by following cursors until all tools are fetched.
   * @returns A complete list of all available tools and their descriptions
   * @throws {Error} Will throw an error if any server request fails during pagination
   */
  async listTools(): Promise<MCPToolSpec[]> {
    const allTools: MCPToolSpec[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const response = await this.client.listTools({ cursor }, {});
      allTools.push(
        ...response.tools.map((tool): MCPToolSpec => {
          // make sure the right type is used
          const inputSchemaType: string = tool.inputSchema.type;
          if (inputSchemaType !== "object") {
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

  getServerCapabilities() {
    return this.client.getServerCapabilities();
  }

  getServerVersion() {
    return this.client.getServerVersion();
  }

  getInstructions() {
    return this.client.getInstructions();
  }

  /**
   * Calls a specific tool on the MCP server with the provided arguments.
   * @param name - The name of the tool to call
   * @param args - Arguments to pass to the tool, must match the tool's expected schema
   * @returns The result from the tool execution
   * @throws {Error} Will throw an error if the tool call fails or if arguments are invalid
   */
  async callTool(
    name: string,
    args: Record<string, unknown>,
    _meta?: Record<string, unknown>,
  ): Promise<MCPToolCallResult> {
    const result = await this.client.callTool({
      name,
      arguments: args,
      _meta,
    });
    return result;
  }

  updateElicitationHandler(
    handler: ((e: ElicitRequest) => Promise<ElicitResult>) | undefined,
  ) {
    // Skip if handler hasn't changed
    if (handler === this.handlers.elicitation) {
      return;
    }

    // Because we advertise the elicitation capability on initial connection, we can only update
    // an existing handler, not add it if we haven't set it yet.
    if (handler && !this.handlers.elicitation) {
      throw new Error("Elicitation handler must be set on create");
    }
    this.handlers = {
      ...this.handlers,
      elicitation: handler,
    };
    if (!handler) {
      const method = ElicitRequestSchema.shape.method.value;
      this.client.removeRequestHandler(method);
      return;
    }
    this.client.setRequestHandler(ElicitRequestSchema, handler);
  }

  updateSamplingHandler(
    handler:
      | ((e: CreateMessageRequest) => Promise<CreateMessageResult>)
      | undefined,
  ) {
    // Skip if handler hasn't changed
    if (handler === this.handlers.sampling) {
      return;
    }

    // Because we advertise the sampling capability on initial connection, we can only update
    // an existing handler, not add it if we haven't set it yet.
    if (handler && !this.handlers.sampling) {
      throw new Error("Sampling handler must be set on create");
    }
    this.handlers = {
      ...this.handlers,
      sampling: handler,
    };
    if (!handler) {
      const method = CreateMessageRequestSchema.shape.method.value;
      this.client.removeRequestHandler(method);
      return;
    }
    this.client.setRequestHandler(CreateMessageRequestSchema, handler);
  }

  async close() {
    // Not really sure which one of these to close first, but we'll close the
    // transport first so that no requests can come in and hit closing/closed
    // clients
    await this.transport.close();
    await this.client.close();
  }
}

/**
 * The result of a tool call.
 * This is the same as the result of a tool call in the OpenAI SDK, but is reified here
 */
export type MCPToolCallResult = Awaited<
  ReturnType<typeof Client.prototype.callTool>
>;

// Example usage:
/*
const mcp = await MCPClient.create('https://api.example.com/mcp', MCPTransport.HTTP);
const tools = await mcp.listTools();
const result = await mcp.callTool('toolName', { arg1: 'value1' });
*/

export interface MCPToolSpec {
  name: string;
  description?: string;
  inputSchema?: JSONSchema7;
}
