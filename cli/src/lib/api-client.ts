import { clearToken, getEffectiveSessionToken } from "./token-storage.js";

/**
 * Base URL for the Tambo API
 * Can be overridden via TAMBO_API_URL environment variable for development
 */
export function getApiBaseUrl(): string {
  return process.env.TAMBO_API_URL ?? "https://tambo.co";
}

/**
 * Check if an error indicates the session is invalid/expired
 */
function isAuthError(error: ApiError): boolean {
  return (
    error.code === "UNAUTHORIZED" ||
    error.statusCode === 401 ||
    error.statusCode === 403
  );
}

/**
 * Error thrown when API requests fail
 */
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

/**
 * tRPC batched response format
 * The server wraps responses in an array for batched requests
 */
interface TRPCBatchedResponse<T> {
  result?: {
    data: {
      json: T;
    };
  };
  error?: {
    message: string;
    code?: string;
    data?: {
      code?: string;
    };
  };
}

/**
 * Make a tRPC request to the Tambo backend
 *
 * tRPC format:
 * - Queries: GET /trpc/procedure?batch=1&input={"0":{"json":{...}}}
 * - Mutations: POST /trpc/procedure?batch=1 with body {"0":{"json":{...}}}
 * - Response: Array of results [{ result: { data: { json: ... } } }]
 */
async function trpcRequest<TOutput>(
  procedure: string,
  type: "query" | "mutation",
  input?: unknown,
): Promise<TOutput> {
  const baseUrl = getApiBaseUrl();
  const sessionToken = getEffectiveSessionToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Use Authorization header for CLI
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  const url = new URL(`/trpc/${procedure}`, baseUrl);
  url.searchParams.set("batch", "1");

  const fetchOptions: RequestInit = {
    headers,
  };

  // tRPC batched format wraps input in {"0": {"json": input}}
  const wrappedInput =
    input !== undefined ? { "0": { json: input } } : { "0": { json: {} } };

  if (type === "query") {
    fetchOptions.method = "GET";
    url.searchParams.set("input", JSON.stringify(wrappedInput));
  } else {
    fetchOptions.method = "POST";
    fetchOptions.body = JSON.stringify(wrappedInput);
  }

  const response = await fetch(url.toString(), fetchOptions);
  const responseText = await response.text();

  let data: TRPCBatchedResponse<TOutput>[];
  try {
    data = JSON.parse(responseText) as TRPCBatchedResponse<TOutput>[];
  } catch {
    throw new ApiError(
      `Invalid JSON response: ${responseText.slice(0, 200)}`,
      response.status,
    );
  }

  // tRPC returns an array for batched requests
  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(
      `Invalid tRPC response format: ${responseText.slice(0, 200)}`,
      response.status,
    );
  }

  const result = data[0];

  if (result.error) {
    const errorCode = result.error.data?.code ?? result.error.code;
    const error = new ApiError(
      result.error.message,
      response.status,
      errorCode,
    );

    // Auto-clear local token if server says session is invalid
    // This keeps local and server sessions in sync
    if (isAuthError(error)) {
      clearToken();
    }

    throw error;
  }

  if (!result.result?.data) {
    throw new ApiError(
      `Missing result data: ${responseText.slice(0, 200)}`,
      response.status,
    );
  }

  return result.result.data.json;
}

// ============================================================================
// Device Auth API
// ============================================================================

export interface InitiateResponse {
  deviceCode: string;
  userCode: string;
  /** Absolute URL for verification page */
  verificationUri: string;
  /** Absolute URL with user_code pre-filled (RFC 8628) */
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export interface PollResponse {
  status: "pending" | "expired" | "complete";
  sessionToken?: string;
  /** Session expiry timestamp (ISO string) - only present when status is "complete" */
  expiresAt?: string | null;
  user?: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
}

/**
 * Device authentication API client
 */
export const deviceAuth = {
  /**
   * Initiate device auth flow
   * Returns device code, user code, and verification URL
   */
  async initiate(): Promise<InitiateResponse> {
    return await trpcRequest<InitiateResponse>(
      "deviceAuth.initiate",
      "mutation",
      undefined,
    );
  },

  /**
   * Poll for auth completion
   * CLI calls this repeatedly until status is "complete" or "expired"
   */
  async poll(deviceCode: string): Promise<PollResponse> {
    return await trpcRequest<PollResponse>("deviceAuth.poll", "query", {
      deviceCode,
    });
  },
};

// ============================================================================
// Project API
// ============================================================================

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface GeneratedApiKey {
  apiKey: string;
  id: string;
}

/**
 * Project API client
 */
export const projectApi = {
  /**
   * Get user's projects
   */
  async getUserProjects(): Promise<Project[]> {
    return await trpcRequest<Project[]>(
      "project.getUserProjects",
      "query",
      undefined,
    );
  },

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<Project> {
    return await trpcRequest<Project>("project.createProject2", "mutation", {
      name,
    });
  },

  /**
   * Generate an API key for a project
   */
  async generateApiKey(
    projectId: string,
    name: string,
  ): Promise<GeneratedApiKey> {
    return await trpcRequest<GeneratedApiKey>(
      "project.generateApiKey",
      "mutation",
      { projectId, name },
    );
  },
};

// ============================================================================
// Sessions API
// ============================================================================

export interface CliSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  notAfter: string | null;
}

/**
 * Sessions API client
 */
const sessionsApi = {
  /**
   * List all CLI sessions for the current user
   */
  async listSessions(): Promise<CliSession[]> {
    return await trpcRequest<CliSession[]>(
      "deviceAuth.listSessions",
      "query",
      undefined,
    );
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return await trpcRequest<{ success: boolean }>(
      "deviceAuth.revokeSession",
      "mutation",
      { sessionId },
    );
  },

  /**
   * Revoke all CLI sessions for the current user
   * More efficient than revoking one by one
   */
  async revokeAllSessions(): Promise<{
    success: boolean;
    revokedCount: number;
  }> {
    return await trpcRequest<{ success: boolean; revokedCount: number }>(
      "deviceAuth.revokeAllSessions",
      "mutation",
      undefined,
    );
  },

  /**
   * Verify current session is valid with the server
   * Returns true if session is valid, false otherwise
   * Automatically clears local token if session is invalid
   */
  async verifySession(): Promise<boolean> {
    try {
      // Any authenticated call works - listSessions is lightweight
      await trpcRequest<CliSession[]>(
        "deviceAuth.listSessions",
        "query",
        undefined,
      );
      return true;
    } catch {
      // If auth error, token was already cleared by trpcRequest
      // Just return false
      return false;
    }
  },
};

/**
 * Verify session with server - use this to ensure local and server are in sync
 * Checks local token first, then verifies with server
 * Automatically clears local token if server says it's invalid
 */
export async function verifySession(): Promise<boolean> {
  return await sessionsApi.verifySession();
}

// ============================================================================
// Combined API client (for auth command compatibility)
// ============================================================================

/**
 * Combined API client with all tRPC procedures
 * Structured similar to tRPC client for consistent usage
 */
export const api = {
  deviceAuth: {
    initiate: {
      async mutate(): Promise<InitiateResponse> {
        return await deviceAuth.initiate();
      },
    },
    poll: {
      async query(input: { deviceCode: string }): Promise<PollResponse> {
        return await deviceAuth.poll(input.deviceCode);
      },
    },
    listSessions: {
      async query(): Promise<CliSession[]> {
        return await sessionsApi.listSessions();
      },
    },
    revokeSession: {
      async mutate(input: {
        sessionId: string;
      }): Promise<{ success: boolean }> {
        return await sessionsApi.revokeSession(input.sessionId);
      },
    },
    revokeAllSessions: {
      async mutate(): Promise<{ success: boolean; revokedCount: number }> {
        return await sessionsApi.revokeAllSessions();
      },
    },
    verifySession: {
      async query(): Promise<boolean> {
        return await sessionsApi.verifySession();
      },
    },
  },
  project: {
    getUserProjects: {
      async query(): Promise<Project[]> {
        return await projectApi.getUserProjects();
      },
    },
    createProject2: {
      async mutate(input: { name: string }): Promise<Project> {
        return await projectApi.createProject(input.name);
      },
    },
    generateApiKey: {
      async mutate(input: {
        projectId: string;
        name: string;
      }): Promise<GeneratedApiKey> {
        return await projectApi.generateApiKey(input.projectId, input.name);
      },
    },
  },
};
