import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// Type will be available when used within the monorepo
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouter = any;

export interface ApiClientOptions {
  token?: string;
}

/**
 * Get the API base URL from environment or use default
 * Defaults to https://tambo.co
 */
export function getApiBaseUrl(): string {
  return process.env.TAMBO_API_URL ?? "https://tambo.co";
}

/**
 * Create a tRPC client for CLI operations
 * Supports bearer token authentication and custom base URL
 */
export function createApiClient(options?: ApiClientOptions) {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "x-trpc-source": "tambo-cli",
  };

  // Add bearer token if provided
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers,
        transformer: superjson,
      }),
    ],
  });
}
