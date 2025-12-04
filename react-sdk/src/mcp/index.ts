/**
 * Entry point for MCP (Model Context Protocol) support in the React SDK.
 *
 * Note: Importing from `@tambo-ai/react/mcp` requires installing the optional
 * peer dependencies `@modelcontextprotocol/sdk`, `zod`, and `zod-to-json-schema`
 * in your application. They are marked as optional so apps that do not use MCP
 * do not need to include them. See the React SDK README for the recommended
 * version ranges.
 */
export { MCPTransport } from "./mcp-client";
export type {
  MCPElicitationHandler,
  MCPHandlers,
  MCPSamplingHandler,
} from "./mcp-client";
export type {
  ElicitationRequestedSchema,
  PrimitiveSchemaDefinition,
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "./elicitation";
export {
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResource,
  useTamboMcpResourceList,
} from "./mcp-hooks";
export type {
  ListPromptEntry,
  ListPromptItem,
  ListResourceEntry,
  ListResourceItem,
} from "./mcp-hooks";
export {
  TamboMcpProvider,
  useTamboMcpElicitation,
  useTamboMcpServers,
  useTamboElicitationContext,
  type ConnectedMcpServer,
  type FailedMcpServer,
  type McpServer,
  type ProviderMCPHandlers,
} from "./tambo-mcp-provider";

// Public MCP server metadata types
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";
