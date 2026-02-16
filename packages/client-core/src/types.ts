/**
 * Core type definitions for Tambo client
 */

import type { QueryClient } from "@tanstack/query-core";
import type TamboAI from "@tambo-ai/typescript-sdk";

/**
 * Configuration options for TamboClient
 */
export interface TamboClientOptions {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API requests (defaults to https://api.tambo.co) */
  baseUrl?: string;
  /** Pre-configured SDK client instance (overrides apiKey/baseUrl) */
  sdkClient?: TamboAI;
  /** Pre-configured QueryClient instance */
  queryClient?: QueryClient;
}

/**
 * Stream event types from the API
 */
export type StreamEvent =
  | { type: "text_message_start"; messageId: string; role: string }
  | { type: "text_message_content"; messageId: string; delta: string }
  | { type: "text_message_end"; messageId: string }
  | { type: "tool_call_start"; toolCallId: string; name: string }
  | { type: "tool_call_args"; toolCallId: string; args: string }
  | { type: "tool_call_end"; toolCallId: string }
  | { type: "error"; error: { message: string; code?: string } }
  | { type: "done" };

/**
 * Options for streaming API requests
 */
export interface StreamOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Maximum number of reconnection attempts (defaults to 3) */
  maxReconnects?: number;
  /** Initial delay between reconnection attempts in milliseconds (defaults to 1000) */
  reconnectDelay?: number;
  /** Stream timeout in milliseconds - aborts if no data received (defaults to 60000) */
  streamTimeout?: number;
}

import type { z } from "zod";

/**
 * Definition for a client-side tool
 */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  /** Unique tool name */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Zod schema for input validation */
  inputSchema: z.ZodSchema<TInput>;
  /** Optional Zod schema for output validation */
  outputSchema?: z.ZodSchema<TOutput>;
  /** Tool execution function */
  execute: (input: TInput) => Promise<TOutput>;
}

/**
 * Result of a tool execution
 */
export interface ToolResult {
  /** ID of the tool call this result responds to */
  toolUseId: string;
  /** Result content */
  content: Array<{ type: "text"; text: string }>;
  /** Whether the tool call resulted in an error */
  isError?: boolean;
}

// Re-export SDK types for convenience
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
} from "@tambo-ai/typescript-sdk/resources/threads/threads";

export type {
  MessageListResponse,
  MessageGetResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/messages";

export type {
  RunRunParams,
  RunRunResponse,
  RunCreateParams,
  RunCreateResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/runs";
