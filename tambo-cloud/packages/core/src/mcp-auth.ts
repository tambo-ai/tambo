import { JWTPayload } from "jose";

/**
 * This is the claim that is used to identify the Tambo MCP server.
 *
 * Note that while this is a URI, it does no map to a real URL, it is just a
 * string that is used to identify this particular MCP information in the JWT.
 */
export const TAMBO_MCP_ACCESS_KEY_CLAIM = "https://api.tambo.co/mcp";

/** This is the payload of the MCP access token, which arrives at the MCP server
 * as a Bearer token via the Authorization header.
 *
 * This allows the MCP server to have some additional information about the MCP access token,
 */
export interface McpAccessTokenPayload extends JWTPayload {
  [TAMBO_MCP_ACCESS_KEY_CLAIM]: {
    projectId: string;
    threadId: string;
  };
}
