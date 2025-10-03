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
interface MCPHandlers {
  elicitation?: (e: ElicitRequest) => Promise<ElicitResult>;
  sampling?: (e: CreateMessageRequest) => Promise<CreateMessageResult>;
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
  private client: Client;
  private transport: SSEClientTransport | StreamableHTTPClientTransport;
  private transportType: MCPTransport;
  public sessionId?: string;
  private endpoint: string;
  private headers: Record<string, string>;
  private authProvider?: OAuthClientProvider;
  private handlers: MCPHandlers;
  /**
   * Tracks an in-flight reconnect so concurrent triggers coalesce
   * (single-flight). When set, additional calls to `reconnect()` or
   * the automatic `onclose` handler will await the same Promise instead of
   * starting another reconnect sequence.
   */
  private reconnecting?: Promise<void>;
  /**
   * Timer id for a scheduled automatic reconnect (used by `onclose`).
   * Present only while waiting for the backoff delay to elapse.
   */
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  /**
   * Count of consecutive automatic reconnect failures used to compute
   * exponential backoff. Reset to 0 after a successful connection.
   */
  private backoffAttempts = 0;

  /**
   * Backoff policy (discoverable constants)
   * - BACKOFF_INITIAL_MS: initial delay for the first automatic retry
   * - BACKOFF_MULTIPLIER: exponential growth factor for each failed attempt
   * - BACKOFF_MAX_MS: upper bound for the delay
   * - BACKOFF_JITTER_RATIO: jitter range as a fraction of the base delay
   *
   * Jitter is applied symmetrically in [-ratio, +ratio]. For example, with a
   * 500ms base delay and 0.2 ratio, the actual delay is in [400ms, 600ms].
   *
   * The backoff applies only to automatic reconnects started from the
   * `onclose` handler. Explicit/manual calls to `reconnect()` run immediately
   * (no backoff), and will preempt any scheduled automatic attempt.
   */
  static readonly BACKOFF_INITIAL_MS = 500;
  static readonly BACKOFF_MULTIPLIER = 2;
  static readonly BACKOFF_MAX_MS = 30_000;
  static readonly BACKOFF_JITTER_RATIO = 0.2;

  public elicitation: EventTarget = new EventTarget();
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
    handlers: MCPHandlers = {},
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
    handlers: MCPHandlers = {},
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
  /**
   * Reconnects to the MCP server, optionally retaining the same session ID.
   *
   * Single‑flight semantics:
   * - If a reconnect is already in progress (triggered either manually or by
   * the automatic `onclose` handler), additional calls will await the
   * in-flight reconnect rather than start another one.
   * - If an automatic reconnect has been scheduled but not yet started (i.e.,
   * we are waiting in a backoff delay), calling `reconnect()` manually will
   * cancel the scheduled attempt and perform an immediate reconnect.
   *
   * Backoff policy:
   * - Backoff delays with jitter are applied only for automatic reconnects
   * (via `onclose`). Manual calls to `reconnect()` do not use backoff.
   * @param newSession - Whether to create a new session (true) or reuse existing session ID (false)
   * @param reportErrorOnClose - Whether to report errors when closing the client
   * Note that only StreamableHTTPClientTransport supports session IDs.
   * @returns A promise that resolves when the reconnect is complete
   */
  async reconnect(newSession = false, reportErrorOnClose = true) {
    // If a reconnect is already running, coalesce into it.
    if (this.reconnecting) {
      return await this.reconnecting;
    }

    // Manual reconnect preempts any scheduled automatic attempt.
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    const doReconnect = async () => {
      const sessionId = newSession ? undefined : this.sessionId;

      // Prevent re-entrant onclose during deliberate close by detaching
      // the handler from the previous client instance.
      const prevClient = this.client;
      // Prevent re-entrant onclose callbacks from the previous client
      prevClient.onclose = undefined;

      try {
        await prevClient.close();
      } catch (error) {
        if (reportErrorOnClose) {
          console.error("Error closing Tambo MCP Client:", error);
        }
      }

      this.transport = this.initializeTransport(sessionId);
      this.client = this.initializeClient();
      await this.client.connect(this.transport);
      // We may have gotten a session id from the server, so we need to set it
      if ("sessionId" in this.transport) {
        this.sessionId = this.transport.sessionId;
        if (sessionId !== this.sessionId) {
          // This is a pretty unusual thing to happen, but it might be possible?
          console.warn("Session id mismatch", sessionId, this.sessionId);
        }
      }
    };

    this.reconnecting = (async () => {
      try {
        await doReconnect();
        // Successful manual reconnect: reset backoff.
        this.backoffAttempts = 0;
      } finally {
        this.reconnecting = undefined;
      }
    })();

    return await this.reconnecting;
  }

  /**
   * Called by the underlying MCP SDK when the connection closes.
   * Schedules an automatic reconnect with bounded exponential backoff and
   * jitter. If a reconnect is already scheduled or running, this is a no-op.
   */
  private onclose() {
    this.scheduleAutoReconnect();
  }

  /**
   * Compute the next backoff delay with symmetric jitter.
   * @returns The next backoff delay in milliseconds
   */
  private computeBackoffDelayMs(): number {
    const base = Math.min(
      MCPClient.BACKOFF_MAX_MS,
      MCPClient.BACKOFF_INITIAL_MS *
        Math.pow(MCPClient.BACKOFF_MULTIPLIER, this.backoffAttempts),
    );
    const jitterRange = MCPClient.BACKOFF_JITTER_RATIO * base;
    const jitter = (Math.random() * 2 - 1) * jitterRange; // [-range, +range]
    const ms = Math.max(0, Math.round(base + jitter));
    return ms;
  }

  /**
   * Schedule an automatic reconnect attempt if one is not already scheduled
   * or running. Uses the backoff policy and self-reschedules on failure.
   */
  private scheduleAutoReconnect() {
    if (this.reconnecting || this.reconnectTimer) {
      return;
    }

    const delayMs = this.computeBackoffDelayMs();
    console.warn(
      "Tambo MCP Client closed; attempting automatic reconnect in",
      `${delayMs}ms`,
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      // Start the actual reconnect (single-flight)
      const inFlight = (this.reconnecting = this.reconnect(false, false));
      try {
        await inFlight;
        // Success: reset attempts
        this.backoffAttempts = 0;
      } catch (err) {
        // Failure: increase attempts; scheduling occurs in finally below so the
        // new timer isn't blocked by `this.reconnecting` being truthy.
        this.backoffAttempts += 1;
        console.warn(
          "Automatic reconnect failed; will retry with backoff.",
          err,
        );
      } finally {
        this.reconnecting = undefined;
        if (this.backoffAttempts > 0) {
          this.scheduleAutoReconnect();
        }
      }
    }, delayMs);
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
    client.onclose = this.onclose.bind(this);
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
  ): Promise<MCPToolCallResult> {
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
    return result;
  }

  updateElicitationHandler(
    handler: ((e: ElicitRequest) => Promise<ElicitResult>) | undefined,
  ) {
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
