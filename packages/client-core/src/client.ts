/**
 * TamboClient - Core client for Tambo AI API
 *
 * Wraps @tambo-ai/typescript-sdk for API communication
 * and @tanstack/query-core for cache management.
 */

import { QueryClient } from "@tanstack/query-core";
import TamboAI from "@tambo-ai/typescript-sdk";
import { createThreadsClient, type ThreadsClient } from "./threads.js";
import type { TamboClientOptions } from "./types.js";

export interface TamboClient {
  /** Underlying Tambo AI SDK client for direct API access */
  readonly sdk: TamboAI;
  /** TanStack QueryClient for cache control */
  readonly queryClient: QueryClient;
  /** Thread management */
  readonly threads: ThreadsClient;
}

/**
 * Create a new Tambo client
 *
 * @param options - Client configuration
 * @returns TamboClient instance
 * @throws Error if apiKey is empty and no sdkClient provided
 */
export function createTamboClient(options: TamboClientOptions): TamboClient {
  const sdk = buildSdk(options);

  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
        },
      },
    });

  // Build a partial client so threads can reference sdk/queryClient
  const base = { sdk, queryClient };

  return {
    ...base,
    threads: createThreadsClient(base),
  };
}

function buildSdk(options: TamboClientOptions): TamboAI {
  if (options.sdkClient) {
    return options.sdkClient;
  }

  if (!options.apiKey || options.apiKey.trim() === "") {
    throw new Error("API key is required");
  }

  return new TamboAI({
    apiKey: options.apiKey,
    ...(options.baseUrl ? { baseURL: options.baseUrl } : {}),
  });
}
