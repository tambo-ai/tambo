/**
 * Entry point for MCP (Model Context Protocol) support in the React SDK.
 *
 * Note: The `@modelcontextprotocol/sdk` is included automatically with `@tambo-ai/react`.
 * If you use features that require schema validation (like component props schemas),
 * you'll need to install `zod` and `zod-to-json-schema` as optional peer dependencies.
 * See the React SDK README for the recommended version ranges.
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
  isMcpResourceEntry,
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
