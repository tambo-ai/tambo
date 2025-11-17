import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { SseError } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type OpenAI from "openai";
import { MCPClient, MCPTransport } from "./mcp-client";

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
  oauthProvider,
}: {
  url: string;
  customHeaders?: Record<string, string>;
  mcpTransport: MCPTransport;
  oauthProvider?: OAuthClientProvider;
}) {
  try {
    const mcpClient = await MCPClient.create(
      url,
      mcpTransport,
      customHeaders,
      oauthProvider,
      undefined, // since we're not doing anything with this session, it's ok to just start a new session
    );
    const capabilities = mcpClient.getServerCapabilities();
    const version = mcpClient.getServerVersion();
    const instructions = mcpClient.getInstructions();
    return {
      valid: true as const,
      capabilities,
      version,
      instructions,
      requiresAuth: !!oauthProvider,
      statusCode: 200,
    };
  } catch (error) {
    if (error instanceof SseError) {
      if (error.code === 401) {
        return {
          valid: true as const,
          error: mcpAuthSupportMessage,
          statusCode: 401,
          requiresAuth: true,
        };
      }
      return {
        valid: false as const,
        error: `Not a valid MCP SSE server: ${error.message}`,
        statusCode: error.code,
        requiresAuth: !!oauthProvider,
      };
    }
    if (error instanceof StreamableHTTPError) {
      return {
        valid: false as const,
        error: `Not a valid MCP Streamable HTTP server: ${error.message}`,
        statusCode: 500,
        requiresAuth: !!oauthProvider,
      };
    }
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        return {
          valid: false as const,
          error: "Server not found: could not resolve the URL",
          statusCode: 404, // fake 404
          requiresAuth: !!oauthProvider,
        };
      }
      if (error.message.includes("HTTP 401")) {
        return {
          valid: true as const,
          statusCode: 401,
          requiresAuth: true,
        };
      }
      return {
        valid: false as const,
        error: error.message,
        statusCode: 500,
        requiresAuth: !!oauthProvider,
      };
    }
    return {
      valid: false as const,
      error: `${error}`,
      statusCode: 500,
      requiresAuth: !!oauthProvider,
    };
  }
}

export function getToolName(
  tool: OpenAI.Chat.Completions.ChatCompletionTool,
): string {
  return tool.type === "function" ? tool.function.name : tool.custom.name;
}

export function getToolDescription(
  tool: OpenAI.Chat.Completions.ChatCompletionTool,
): string | undefined {
  return tool.type === "function"
    ? tool.function.description
    : tool.custom.description;
}
