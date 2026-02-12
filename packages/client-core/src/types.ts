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
