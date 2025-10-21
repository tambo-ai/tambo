import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "@tambo-ai-cloud/core";
import { getDb, HydraDb } from "@tambo-ai-cloud/db";
import { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getThreadMCPClients } from "src/common/systemTools";
import { extractAndVerifyMcpAccessToken } from "../common/utils/oauth";
import { registerPromptHandlers } from "./prompts";

export async function createMcpServer(
  db: HydraDb,
  projectId: string,
  threadId: string,
) {
  const server = new McpServer(
    {
      name: "tambo-service",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: { listChanged: true },
      },
      // Enable notification debouncing for specific methods
      debouncedNotificationMethods: [
        "notifications/tools/list_changed",
        "notifications/resources/list_changed",
        "notifications/prompts/list_changed",
      ],
    },
  );

  const mcpHandlers = {};
  const mcpClients = await getThreadMCPClients(
    db,
    projectId,
    threadId,
    mcpHandlers,
  );
  await registerPromptHandlers(server, mcpClients);
  return {
    server,
    /**
     * Dispose any upstream MCP clients created for this request lifecycle.
     * We intentionally swallow errors so one bad client doesn't prevent cleanup of others.
     */
    async dispose() {
      await Promise.allSettled(
        mcpClients.map(async ({ client: upstream }) => {
          try {
            // Prefer a direct close if exposed on the wrapper
            const maybeClosable = upstream as unknown as {
              close?: () => Promise<void>;
            };
            if (typeof maybeClosable.close === "function") {
              return await maybeClosable.close();
            }
            // Fallback to closing the underlying SDK client
            const inner = (upstream as any).client as
              | {
                  close?: () => Promise<void>;
                }
              | undefined;
            if (typeof inner?.close === "function") {
              return await inner.close();
            }
          } catch {
            // swallow to keep cleanup best-effort
          }
          return;
        }),
      );
    },
  };
}

const handler = async (
  req: Request,
  res: Response,
  projectId: string,
  threadId: string,
) => {
  const db = getDb(process.env.DATABASE_URL!);
  // we create the "server" on the fly, it only lives for the duration of the request,
  // though the request could stay open for a long time if there is streaming/etc.
  const { server, dispose } = await createMcpServer(db, projectId, threadId);
  const transport = new StreamableHTTPServerTransport({
    // we don't actually use the session id, but it's required for the transport
    sessionIdGenerator: () => randomUUID(),
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } finally {
    await server.close();
    await transport.close();
    await dispose();
  }
};

/**
 * Register an express route that handles MCP requests for a given path
 * @param expressApp - The express application to register the route on
 * @param path - The path to register the route on
 * @param server - The MCP server to handle the requests
 */
export function registerHandler(expressApp: Express, path: string) {
  // MCP over HTTP expects POST; restrict to POST to avoid ambiguity
  expressApp.post(path, async (req, res) => {
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
        | { projectId?: string; threadId?: string }
        | undefined;
      if (!claim || !claim.projectId || !claim.threadId) {
        res.status(403).send("Forbidden");
        return;
      }
      const { projectId, threadId } = claim;
      return await handler(req, res, projectId, threadId);
    } catch (_err) {
      res.status(401).send("Unauthorized");
      return;
    }
  });
}
