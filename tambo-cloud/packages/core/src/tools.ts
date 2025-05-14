import { SseError } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClient, MCPTransport } from "./MCPClient";

export enum ToolProviderType {
  COMPOSIO = "composio",
  MCP = "mcp",
}

const mcpAuthSupportMessage =
  "Server requires authentication. Tambo support for MCP Auth is coming soon!";
export async function validateMcpServer({
  url,
  customHeaders,
  mcpTransport,
}: {
  url: string;
  customHeaders?: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  try {
    const mcpClient = await MCPClient.create(url, mcpTransport, customHeaders);
    await mcpClient.listTools();
  } catch (error) {
    if (error instanceof SseError) {
      if (error.code === 401) {
        return {
          valid: false as const,
          error: mcpAuthSupportMessage,
          statusCode: 401,
        };
      }
      return {
        valid: false as const,
        error: `Not a valid MCP SSE server: ${error.message}`,
        statusCode: error.code,
      };
    }
    if (error instanceof StreamableHTTPError) {
      return {
        valid: false as const,
        error: `Not a valid MCP Streamable HTTP server: ${error.message}`,
      };
    }
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        return {
          valid: false as const,
          error: "Server not found: could not resolve the URL",
          statusCode: 404, // fake 404
        };
      }
      if (error.message.includes("HTTP 401")) {
        return {
          valid: false as const,
          error: mcpAuthSupportMessage,
          statusCode: 401,
        };
      }
      return {
        valid: false as const,
        error: error.message,
        statusCode: 500,
      };
    }
    return {
      valid: false as const,
      error: `${error}`,
      statusCode: 500,
    };
  }
  return {
    valid: true as const,
    error: null,
  };
}
