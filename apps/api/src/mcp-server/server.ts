import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { MCPHandlers } from "@tambo-ai-cloud/core";
import { TAMBO_MCP_ACCESS_KEY_CLAIM, hashKey } from "@tambo-ai-cloud/core";
import { getDb, HydraDb } from "@tambo-ai-cloud/db";
import cors from "cors";
import { Express, NextFunction, Request, Response } from "express";
import { getThreadMCPClients } from "src/common/systemTools";
import { extractAndVerifyMcpAccessToken } from "../common/utils/oauth";
import { registerElicitationHandlers } from "./elicitations";
import { registerPromptHandlers } from "./prompts";
import { registerResourceHandlers } from "./resources";

const MCP_REQUEST_PROJECT_ID = Symbol("mcpProjectId");
const MCP_REQUEST_THREAD_ID = Symbol("mcpThreadId");
const MCP_REQUEST_CONTEXT_KEY = Symbol("mcpContextKey");

interface AuthenticatedMcpRequest extends Request {
  [MCP_REQUEST_PROJECT_ID]?: string;
  [MCP_REQUEST_THREAD_ID]?: string;
  [MCP_REQUEST_CONTEXT_KEY]?: string;
}

/**
 * Fixed-window rate limiter for MCP endpoints.
 * Uses hashed API keys as tracker when available, falls back to IP.
 * MCP runs outside the NestJS guard pipeline, so this is a standalone
 * Express middleware rate limiter.
 */
const rawMcpRateLimit = process.env.RATE_LIMIT_MCP ?? "60";
const MCP_RATE_LIMIT = Number(rawMcpRateLimit);
if (!Number.isFinite(MCP_RATE_LIMIT) || MCP_RATE_LIMIT <= 0) {
  throw new Error(
    `Invalid RATE_LIMIT_MCP="${rawMcpRateLimit}": must be a positive number.`,
  );
}
const MCP_RATE_WINDOW_MS = 60_000;
const mcpRateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

// Sweep expired entries every minute instead of on every request.
// unref() prevents the timer from keeping the process alive.
const mcpSweepInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of mcpRateLimitStore) {
    if (now - entry.windowStart > MCP_RATE_WINDOW_MS) {
      mcpRateLimitStore.delete(key);
    }
  }
}, MCP_RATE_WINDOW_MS);
mcpSweepInterval.unref();

function mcpRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];
  const key = Array.isArray(apiKey) ? apiKey[0] : apiKey;
  const tracker = key
    ? `mcp:apikey:${hashKey(key)}`
    : `mcp:ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;

  const now = Date.now();
  const entry = mcpRateLimitStore.get(tracker);

  if (!entry || now - entry.windowStart > MCP_RATE_WINDOW_MS) {
    mcpRateLimitStore.set(tracker, { count: 1, windowStart: now });
    res.setHeader("X-RateLimit-Limit", MCP_RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", MCP_RATE_LIMIT - 1);
    next();
    return;
  }

  entry.count++;

  if (entry.count > MCP_RATE_LIMIT) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + MCP_RATE_WINDOW_MS - now) / 1000,
    );
    res.setHeader("Retry-After", retryAfterSeconds);
    res.setHeader("X-RateLimit-Limit", MCP_RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(entry.windowStart + MCP_RATE_WINDOW_MS).toISOString(),
    );
    res.status(429).json({
      type: "https://docs.tambo.co/reference/problems/rate-limit",
      status: 429,
      title: "Too Many Requests",
      detail: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      instance: req.originalUrl ?? req.url,
    });
    return;
  }

  res.setHeader("X-RateLimit-Limit", MCP_RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", MCP_RATE_LIMIT - entry.count);
  next();
}

export async function createMcpServer(
  db: HydraDb,
  projectId: string,
  threadId: string,
) {
  // Fetch MCP clients first to determine what capabilities we can actually support
  // These will be immediately replaced by the handlers from the MCP clients,
  // but we need to set them now so that MCPClient.create() tells the servers that we support elicitation and sampling.
  const mcpHandlers: Partial<MCPHandlers> = {
    elicitation: async (_request) => {
      throw new Error("Not implemented");
    },
  };
  const mcpClients = await getThreadMCPClients(
    db,
    projectId,
    threadId,
    mcpHandlers,
  );

  // Only advertise prompts/resources capabilities if we have MCP clients to proxy from.
  // This prevents "Method not found" errors when no MCP servers are configured.
  const hasClients = mcpClients.length > 0;

  const server = new McpServer(
    {
      name: "tambo-service",
      version: "1.0.0",
    },
    {
      capabilities: hasClients
        ? { prompts: { listChanged: true }, resources: { listChanged: true } }
        : {},
      // Enable notification debouncing for specific methods
      debouncedNotificationMethods: [
        "notifications/tools/list_changed",
        "notifications/resources/list_changed",
        "notifications/prompts/list_changed",
      ],
    },
  );

  await registerPromptHandlers(server, mcpClients);
  await registerResourceHandlers(server, mcpClients);
  registerElicitationHandlers(server, mcpClients);
  return {
    server,
    /**
     * Dispose any upstream MCP clients created for this request lifecycle.
     * We intentionally swallow errors so one bad client doesn't prevent cleanup of others.
     */
    async dispose() {
      await Promise.allSettled(
        mcpClients.map(async ({ client }) => {
          try {
            await client.close();
          } catch {
            // swallow to keep cleanup best-effort
          }
          return;
        }),
      );
    },
  };
}

/**
 * Creates a session-less MCP server that only supports resources and prompts.
 * Does not support elicitation or sampling as those require a thread/session.
 */
export async function createSessionlessMcpServer(
  db: HydraDb,
  projectId: string,
  _contextKey: string,
) {
  // Fetch MCP clients first to determine what capabilities we can actually support
  // Session-less servers don't support elicitation/sampling, so no handlers needed
  // We create MCP clients without thread context
  const mcpClients = await getThreadMCPClients(db, projectId, null, {});

  // Only advertise prompts/resources capabilities if we have MCP clients to proxy from.
  // This prevents "Method not found" errors when no MCP servers are configured.
  const hasClients = mcpClients.length > 0;

  const server = new McpServer(
    {
      name: "tambo-service",
      version: "1.0.0",
    },
    {
      capabilities: hasClients
        ? { prompts: { listChanged: true }, resources: { listChanged: true } }
        : {},
      // Enable notification debouncing for specific methods
      debouncedNotificationMethods: [
        "notifications/tools/list_changed",
        "notifications/resources/list_changed",
        "notifications/prompts/list_changed",
      ],
    },
  );

  await registerPromptHandlers(server, mcpClients);
  await registerResourceHandlers(server, mcpClients);
  // No elicitation handlers for session-less servers

  return {
    server,
    /**
     * Dispose any upstream MCP clients created for this request lifecycle.
     * We intentionally swallow errors so one bad client doesn't prevent cleanup of others.
     */
    async dispose() {
      await Promise.allSettled(
        mcpClients.map(async ({ client }) => {
          try {
            await client.close();
          } catch {
            // swallow to keep cleanup best-effort
          }
          return;
        }),
      );
    },
  };
}

/**
 * Express middleware that authenticates MCP requests using bearer tokens.
 * Extracts projectId and either threadId (for thread-bound tokens) or contextKey
 * (for session-less tokens) from the token claims and attaches them to the request.
 */
async function authenticateMcpRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");
  if (!authorization) {
    res.status(401).send("Unauthorized");
    return;
  }

  // make sure authorization is a bearer token
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    res.status(401).send("Unauthorized");
    return;
  }

  const [, bearerToken] = authorization.split(" ");
  try {
    const payload = await extractAndVerifyMcpAccessToken(
      bearerToken,
      process.env.API_KEY_SECRET!,
    );
    const claim = payload[TAMBO_MCP_ACCESS_KEY_CLAIM] as
      | { projectId?: string; threadId?: string; contextKey?: string }
      | undefined;

    if (!claim || !claim.projectId) {
      res.status(403).send("Forbidden");
      return;
    }

    // Attach projectId which is common to both token types
    (req as AuthenticatedMcpRequest)[MCP_REQUEST_PROJECT_ID] = claim.projectId;

    // Attach either contextKey (session-less) or threadId (thread-bound)
    if (claim.contextKey) {
      (req as AuthenticatedMcpRequest)[MCP_REQUEST_CONTEXT_KEY] =
        claim.contextKey;
    } else if (claim.threadId) {
      (req as AuthenticatedMcpRequest)[MCP_REQUEST_THREAD_ID] = claim.threadId;
    } else {
      res.status(403).send("Forbidden");
      return;
    }

    next();
  } catch (_err) {
    res.status(401).send("Unauthorized");
    return;
  }
}

const handler = async (req: AuthenticatedMcpRequest, res: Response) => {
  const projectId = req[MCP_REQUEST_PROJECT_ID];
  const threadId = req[MCP_REQUEST_THREAD_ID];
  const contextKey = req[MCP_REQUEST_CONTEXT_KEY];

  if (!projectId) {
    res.status(401).send("Unauthorized");
    return;
  }

  // Detect token type based on presence of contextKey (sessionless) vs threadId (thread-bound)
  const isSessionless = !!contextKey;

  // Validate we have the required fields for the token type
  if (isSessionless && !contextKey) {
    res.status(401).send("Unauthorized");
    return;
  }
  if (!isSessionless && !threadId) {
    res.status(401).send("Unauthorized");
    return;
  }

  const db = getDb(process.env.DATABASE_URL!);
  // we create the "server" on the fly, it only lives for the duration of the request,
  // though the request could stay open for a long time if there is streaming/etc.
  const { server, dispose } = isSessionless
    ? await createSessionlessMcpServer(db, projectId, contextKey)
    : await createMcpServer(db, projectId, threadId!);

  const transport = new StreamableHTTPServerTransport({
    // we don't actually use the session id, but it's required for the transport
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", async () => {
    // make the server transport is closed first so no requests can come in and
    // hit closing/closed clients
    await transport.close();
    await dispose();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
};

/**
 * Register an express route that handles MCP requests for a given path
 * @param expressApp - The express application to register the route on
 * @param path - The path to register the route on
 * @param server - The MCP server to handle the requests
 */
export function registerHandler(expressApp: Express, path: string) {
  expressApp.use(
    path,
    // Enable CORS for all routes so Inspector can connect
    cors({
      origin: "*", // use "*" with caution in production
      methods: "GET,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      exposedHeaders: [
        "mcp-session-id",
        "last-event-id",
        "mcp-protocol-version",
      ],
    }),
    // Rate limit MCP requests after CORS but before authentication
    mcpRateLimitMiddleware,
    // Authenticate the request
    authenticateMcpRequest,
  );

  // MCP over HTTP expects POST; restrict to POST to avoid ambiguity
  expressApp.use(path, async (req, res) => {
    return await handler(req as AuthenticatedMcpRequest, res);
  });
}
