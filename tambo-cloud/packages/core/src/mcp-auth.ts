/** This is the payload of the MCP access token, which arrives at the MCP server
 * as a Bearer token via the Authorization header.
 *
 * This allows the MCP server to have some
 */
export interface McpAccessTokenPayload {
  sub: string;
  projectId: string;
  threadId: string;
  contextKey: string | null;
  iat?: number;
  exp?: number;
}
