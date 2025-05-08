/**
 * Minimal Model Context Protocol (MCP) client using JSON-RPC 2.0
 * Supports only listTools() and callTool() operations
 */

/**
 * Interface representing a Tool in the MCP
 */
export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  annotations?: Record<string, any>;
}

/**
 * Response from tools/list endpoint
 */
export interface ListToolsResult {
  tools: Tool[];
}

/**
 * Content type for tool responses
 */
export interface ToolContent {
  type: string;
  text?: string;
  annotations?: Record<string, any>;
}

/**
 * Response from tools/call endpoint
 */
export interface CallToolResult {
  content: ToolContent[];
  isError?: boolean;
}

/**
 * A minimal TypeScript client for the Model Context Protocol (MCP)
 *
 * This client provides a streamlined interface to communicate with MCP servers
 * using JSON-RPC 2.0 over HTTP. It supports listing available tools and calling tools
 * with arguments, including support for Server-Sent Events (SSE) streaming responses.
 * @example
 * ```typescript
 * // Basic usage
 * const mcpClient = new MCPClient('https://example.com/mcp');
 * const tools = await mcpClient.listTools();
 * const toolResponse = await mcpClient.callTool('my-tool', { arg1: 'value1' });
 *
 * // For streaming responses:
 * const stream = await mcpClient.callToolStream('streaming-tool', { arg1: 'value1' });
 * for await (const chunk of mcpClient.parseStreamingResponses(stream)) {
 *   console.log('Received chunk:', chunk);
 * }
 * ```
 */
export class MCPClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private requestId = 1;

  /**
   * Creates a new MCP client
   * @param url - The base URL of the MCP server
   * @param extraHeaders - Optional additional headers to include in requests
   */
  constructor(url: string, extraHeaders?: Record<string, string>) {
    this.baseUrl = url.endsWith("/") ? url : `${url}/`;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(extraHeaders ?? {}),
    };
  }

  /**
   * Lists available tools on the MCP server
   * @returns Promise resolving to the list of available tools
   */
  async listTools(): Promise<ListToolsResult> {
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
      id: this.requestId++,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(jsonRpcRequest),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to list tools: ${response.status} ${response.statusText}`,
      );
    }

    const jsonRpcResponse = await response.json();

    // Handle JSON-RPC error
    if (jsonRpcResponse.error) {
      throw new Error(
        `JSON-RPC error: ${jsonRpcResponse.error.code} - ${jsonRpcResponse.error.message}`,
      );
    }

    return jsonRpcResponse.result;
  }

  /**
   * Calls a tool with the provided arguments
   * @param toolName - The name of the tool to call
   * @param args - The arguments to pass to the tool
   * @returns Promise resolving to the tool's response
   */
  async callTool(toolName: string, args: any): Promise<CallToolResult> {
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
      id: this.requestId++,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(jsonRpcRequest),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call tool ${toolName}: ${response.status} ${response.statusText}`,
      );
    }

    const jsonRpcResponse = await response.json();

    // Handle JSON-RPC error
    if (jsonRpcResponse.error) {
      throw new Error(
        `JSON-RPC error: ${jsonRpcResponse.error.code} - ${jsonRpcResponse.error.message}`,
      );
    }

    return jsonRpcResponse.result;
  }

  /**
   * Calls a tool with the provided arguments and returns a stream of results
   * @param toolName - The name of the tool to call
   * @param args - The arguments to pass to the tool
   * @returns ReadableStream of the tool's response
   */
  async callToolStream(
    toolName: string,
    args: any,
  ): Promise<ReadableStream<Uint8Array>> {
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
      id: this.requestId++,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        ...this.headers,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(jsonRpcRequest),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call tool ${toolName}: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Return the response body as a stream
    return response.body;
  }

  /**
   * Parse SSE messages from a stream into JSON-RPC responses
   * @param stream - ReadableStream to parse
   * @returns AsyncGenerator yielding parsed JSON-RPC responses
   * @yields {CallToolResult} The parsed JSON-RPC response
   */
  async *parseStreamingResponses(
    stream: ReadableStream<Uint8Array>,
  ): AsyncGenerator<CallToolResult, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonData = line.slice(6).trim();
            try {
              const jsonRpcResponse = JSON.parse(jsonData);

              // Handle JSON-RPC error
              if (jsonRpcResponse.error) {
                throw new Error(
                  `JSON-RPC error: ${jsonRpcResponse.error.code} - ${jsonRpcResponse.error.message}`,
                );
              }

              yield jsonRpcResponse.result;
            } catch (e) {
              console.error("Failed to parse JSON:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
