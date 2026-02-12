/**
 * TamboClient - Core client for Tambo AI API
 */

import { fetchWithRetry } from "./retry.js";
import { ThreadsClient } from "./threads.js";
import {
  ApiError,
  type TamboClientOptions,
  type RequestOptions,
} from "./types.js";

/**
 * Core client for authenticated Tambo AI API requests
 */
export class TamboClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  /** Thread management client */
  public readonly threads: ThreadsClient;

  /**
   * Create a new Tambo client
   *
   * @param options - Client configuration
   * @throws Error if apiKey is empty
   */
  constructor(options: TamboClientOptions) {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new Error("API key is required");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.tambo.co";
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 3;

    // Initialize sub-clients
    this.threads = new ThreadsClient(this);
  }

  /**
   * Make an authenticated API request with retry logic
   *
   * @param path - API path (will be appended to baseUrl)
   * @param options - Request options
   * @returns Promise resolving to parsed JSON response
   * @throws ApiError on non-2xx responses
   */
  async fetch<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    // Build headers with authentication
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options?.headers,
    };

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Merge abort signals if provided
    if (options?.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      // Wrap fetch in retry logic
      const response = await fetchWithRetry(
        async () => {
          const fetchOptions: RequestInit = {
            method: options?.method ?? "GET",
            headers,
            signal: controller.signal,
          };

          // Add body if provided
          if (options?.body !== undefined) {
            fetchOptions.body = JSON.stringify(options.body);
          }

          const res = await fetch(url, fetchOptions);

          // Check for non-ok responses
          if (!res.ok) {
            let body: unknown;
            try {
              body = await res.json();
            } catch {
              body = await res.text();
            }

            throw new ApiError(
              `API request failed: ${res.status} ${res.statusText}`,
              res.status,
              res.statusText,
              body,
            );
          }

          return res;
        },
        { numOfAttempts: this.maxRetries },
      );

      // Parse and return JSON response
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
