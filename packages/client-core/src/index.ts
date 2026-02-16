// @tambo-ai/client-core - Core TypeScript client for Tambo AI API

export { createTamboClient } from "./client.js";
export type { TamboClient } from "./client.js";
export { createThreadsClient } from "./threads.js";
export type { ThreadsClient } from "./threads.js";
export { threadKeys } from "./query.js";
export { createToolRegistry } from "./tools.js";
export type { ToolRegistry } from "./tools.js";
export { executeRun } from "./run.js";
export type { RunOptions } from "./run.js";
export { streamEvents } from "./streaming.js";
export type {
  TamboClientOptions,
  StreamEvent,
  StreamOptions,
  ToolDefinition,
  ToolResult,
} from "./types.js";

// Re-export SDK types for consumer convenience
export type {
  ThreadCreateResponse,
  ThreadRetrieveResponse,
  ThreadListResponse,
  ThreadCreateParams,
  ThreadListParams,
  ThreadDeleteParams,
  TextContent,
  ComponentContent,
  ResourceContent,
  ToolUseContent,
  ToolResultContent,
  RunError,
  MessageListResponse,
  MessageGetResponse,
  RunRunParams,
  RunRunResponse,
  RunCreateParams,
  RunCreateResponse,
} from "./types.js";

// Re-export QueryClient for consumer cache access
export { QueryClient } from "@tanstack/query-core";
