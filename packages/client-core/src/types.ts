/**
 * Core type definitions for Tambo client
 */

/**
 * Configuration options for TamboClient
 */
export interface TamboClientOptions {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API requests (defaults to https://api.tambo.co) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
  /** Maximum number of retry attempts (defaults to 3) */
  maxRetries?: number;
}

/**
 * Options for individual API requests
 */
export interface RequestOptions {
  /** HTTP method (defaults to GET) */
  method?: string;
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Additional headers to merge with defaults */
  headers?: Record<string, string>;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * API error with status information
 */
export class ApiError extends Error {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response body */
  body: unknown;

  /**
   * Create an API error
   *
   * @param message - Error message
   * @param status - HTTP status code
   * @param statusText - HTTP status text
   * @param body - Response body
   */
  constructor(
    message: string,
    status: number,
    statusText: string,
    body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/**
 * Content part types for messages
 */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: string } };

/**
 * Message in a thread
 */
export interface Message {
  /** Message ID */
  id: string;
  /** Thread ID this message belongs to */
  threadId: string;
  /** Message role */
  role: "user" | "assistant" | "system" | "tool";
  /** Message content parts */
  content: ContentPart[];
  /** Timestamp when message was created */
  createdAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Thread with messages
 */
export interface Thread {
  /** Thread ID */
  id: string;
  /** Project ID this thread belongs to */
  projectId: string;
  /** Optional context key for scoping threads to users/sessions */
  contextKey?: string;
  /** Messages in this thread */
  messages: Message[];
  /** Timestamp when thread was created */
  createdAt: string;
  /** Timestamp when thread was last updated */
  updatedAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for creating a thread
 */
export interface CreateThreadParams {
  /** Project ID to create thread in */
  projectId: string;
  /** Optional context key for scoping to user/session */
  contextKey?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  /** Message content as ContentPart array or string (auto-wrapped) */
  content: ContentPart[] | string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for listing threads
 */
export interface ListThreadsParams {
  /** Project ID to list threads for */
  projectId: string;
  /** Optional context key filter */
  contextKey?: string;
  /** Maximum number of threads to return */
  limit?: number;
  /** Number of threads to skip */
  offset?: number;
}
