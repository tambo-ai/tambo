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
          valid: false,
          error: mcpAuthSupportMessage,
        };
      }
      return {
        valid: false,
        error: `Not a valid MCP SSE server: ${error.message}`,
      };
    }
    if (error instanceof StreamableHTTPError) {
      return {
        valid: false,
        error: `Not a valid MCP Streamable HTTP server: ${error.message}`,
      };
    }
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        return {
          valid: false,
          error: "Server not found: could not resolve the URL",
        };
      }
      if (error.message.includes("HTTP 401")) {
        return {
          valid: false,
          error: mcpAuthSupportMessage,
        };
      }
      return {
        valid: false,
        error: error.message,
      };
    }
    return {
      valid: false,
      error: `${error}`,
    };
  }
  return {
    valid: true,
    error: null,
  };
}
