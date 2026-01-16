/**
 * CLI API Client - tRPC vanilla client with stub router typing
 */
import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";

import { clearToken, getEffectiveSessionToken } from "./token-storage.js";

// ============================================================================
// Types - Response shapes from the API
// ============================================================================

export interface InitiateResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export interface PollResponse {
  status: "pending" | "expired" | "complete";
  sessionToken?: string;
  expiresAt?: string | null;
}

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
}

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
}

export interface GeneratedApiKey {
  id: string;
  apiKey: string;
}

// ============================================================================
// Stub Router Type - Mirrors the server's AppRouter shape for CLI routes
//
// This provides type safety for the tRPC client without importing the actual
// AppRouter from the web app (which would create a circular dependency).
// ============================================================================

interface StubRouter {
  deviceAuth: {
    initiate: { mutate: () => Promise<InitiateResponse> };
    poll: { query: (input: { deviceCode: string }) => Promise<PollResponse> };
    listSessions: { query: () => Promise<Session[]> };
    revokeSession: {
      mutate: (input: { sessionId: string }) => Promise<{ success: boolean }>;
    };
    revokeAllSessions: {
      mutate: () => Promise<{ success: boolean; revokedCount: number }>;
    };
  };
  project: {
    getUserProjects: { query: (input: object) => Promise<Project[]> };
    createProject2: { mutate: (input: { name: string }) => Promise<Project> };
    generateApiKey: {
      mutate: (input: {
        projectId: string;
        name: string;
      }) => Promise<GeneratedApiKey>;
    };
  };
  user: {
    getUser: { query: () => Promise<UserInfo> };
  };
}

// ============================================================================
// Client Setup
// ============================================================================

/**
 * Returns the base URL for the Tambo Console API (apps/web at app.tambo.co).
 * Note: This is NOT the NestJS REST API at api.tambo.co.
 */
export function getConsoleBaseUrl(): string {
  return process.env.TAMBO_CLI_CONSOLE_BASE_URL ?? "https://console.tambo.co";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    const code = error.data?.code ?? error.shape?.data?.code;
    return (
      code === "UNAUTHORIZED" ||
      error.data?.httpStatus === 401 ||
      error.data?.httpStatus === 403
    );
  }
  return false;
}

// Create raw tRPC client
const rawClient = createTRPCClient({
  links: [
    httpLink({
      url: `${getConsoleBaseUrl()}/trpc`,
      transformer: superjson,
      headers() {
        const token = getEffectiveSessionToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      async fetch(url, options) {
        const res = await globalThis.fetch(url, options);
        if (res.status === 401 || res.status === 403) {
          clearToken();
        }
        return res;
      },
    }),
  ],
});

// Export typed client - cast to StubRouter for type safety and autocomplete
export const api = rawClient as unknown as StubRouter;

// ============================================================================
// Convenience Exports
// ============================================================================

export async function verifySession(): Promise<boolean> {
  try {
    await api.deviceAuth.listSessions.query();
    return true;
  } catch {
    return false;
  }
}
