export type {
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
  useTamboElicitationContext,
  useTamboMcpElicitation,
  useTamboMcpServers,
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
