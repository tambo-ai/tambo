/**
 * CLI API Client - tRPC vanilla client with typed wrappers
 */
import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";

import { clearToken, getEffectiveSessionToken } from "./token-storage.js";

// ============================================================================
// Types
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
  user?: { id: string; email: string | null; name: string | null } | null;
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
// Client Setup
// ============================================================================

export function getApiBaseUrl(): string {
  return process.env.TAMBO_API_URL ?? "https://tambo.co";
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

// Raw tRPC client (typed as any since we can't import AppRouter)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client: any = createTRPCClient({
  links: [
    httpLink({
      url: `${getApiBaseUrl()}/trpc`,
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

// ============================================================================
// Typed Wrappers
// ============================================================================

export const deviceAuth = {
  initiate: async (): Promise<InitiateResponse> =>
    client.deviceAuth.initiate.mutate(),

  poll: async (deviceCode: string): Promise<PollResponse> =>
    client.deviceAuth.poll.query({ deviceCode }),

  listSessions: async (): Promise<Session[]> =>
    client.deviceAuth.listSessions.query(),

  revokeSession: async (sessionId: string): Promise<{ success: boolean }> =>
    client.deviceAuth.revokeSession.mutate({ sessionId }),

  revokeAllSessions: async (): Promise<{
    success: boolean;
    revokedCount: number;
  }> => client.deviceAuth.revokeAllSessions.mutate(),
};

export const projectApi = {
  getUserProjects: async (): Promise<Project[]> =>
    client.project.getUserProjects.query({}),

  createProject: async (name: string): Promise<Project> =>
    client.project.createProject2.mutate({ name }),

  generateApiKey: async (
    projectId: string,
    name: string,
  ): Promise<GeneratedApiKey> =>
    client.project.generateApiKey.mutate({ projectId, name }),
};

export async function verifySession(): Promise<boolean> {
  try {
    await deviceAuth.listSessions();
    return true;
  } catch {
    return false;
  }
}

// Also export raw client for direct tRPC access if needed
export const api = client;

export { TRPCClientError };
