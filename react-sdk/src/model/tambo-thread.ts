import TamboAI from "@tambo-ai/typescript-sdk";
import { TamboThreadMessage } from "./generate-component-response";

/**
 * An extension of the TamboAI.Beta.Thread type that includes
 * messages with renderedComponent and MCP token information
 */
export interface TamboThread extends TamboAI.Beta.Thread {
  messages: TamboThreadMessage[];
  /**
   * MCP access token for the internal Tambo MCP server.
   * This token is specific to this thread.
   */
  mcpAccessToken?: string;
}
