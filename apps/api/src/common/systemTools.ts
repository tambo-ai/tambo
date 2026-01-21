import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { Logger } from "@nestjs/common";
import {
  McpToolRegistry,
  type McpToolSource,
  prefixToolName,
} from "@tambo-ai-cloud/backend";
import {
  getToolName,
  LogLevel,
  MCPClient,
  MCPHandlers,
} from "@tambo-ai-cloud/core";
import {
  HydraDatabase,
  HydraDb,
  OAuthLocalProvider,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { env } from "process";

const logger = new Logger("systemTools");

class ListToolsError extends Error {
  constructor(
    message: string,
    public readonly serverId: string,
    public readonly url: string,
    cause?: unknown,
  ) {
    // Preserve the original error via the native cause chain
    super(message, { cause });
    this.name = "ListToolsError";
  }
}

/** Get the available MCP tools for the project, checking for duplicate tool names */
export async function getSystemTools(
  db: HydraDatabase,
  projectId: string,
  threadId: string | null,
  mcpHandlers: MCPHandlers,
): Promise<McpToolRegistry> {
  const { mcpToolsSchema, mcpToolSources } = await getMcpTools(
    db,
    projectId,
    threadId,
    mcpHandlers,
  );

  const mcpToolNames = mcpToolsSchema.map((tool) => getToolName(tool));
  // make sure there are no name conflicts
  if (new Set(mcpToolNames).size !== mcpToolNames.length) {
    const duplicateToolNames = mcpToolNames.filter(
      (toolName, index) => mcpToolNames.indexOf(toolName) !== index,
    );
    console.warn(
      `Tool names must be unique, found duplicates for project ${projectId}: ${duplicateToolNames.join(
        ", ",
      )}`,
    );
  }
  return {
    mcpToolsSchema,
    mcpToolSources,
    mcpHandlers,
  };
}

type ThreadMcpClient = {
  client: MCPClient;
  serverId: string;
  serverKey: string;
  url: string;
};

/** Get all MCP clients for a project. If a threadId is provided, then the MCP
 * clients will also be associated with the thread, using that thread's
 * sessionId.
 *
 * If no threadId is provided, then the MCP clients will not be associated with
 * any thread, and the elicitations and sampling handlers will not be registered.
 */
export async function getThreadMCPClients(
  db: HydraDb,
  projectId: string,
  threadId: string | null,
  mcpHandlers: Partial<MCPHandlers>,
): Promise<ThreadMcpClient[]> {
  const mcpServers = await operations.getProjectMcpServers(db, projectId, null);

  const results = await Promise.allSettled(
    mcpServers.map(async (mcpServer) => {
      if (!mcpServer.url) {
        await operations.addProjectLogEntry(
          db,
          projectId,
          LogLevel.WARNING,
          `MCP server ${mcpServer.id} has no URL configured`,
          { mcpServerId: mcpServer.id },
        );
        throw new Error("No URL provided");
      }

      if (mcpServer.mcpRequiresAuth && !hasAuthInfo(mcpServer)) {
        logger.warn(
          `MCP server ${mcpServer.id} in project ${projectId} requires auth, but no auth info found`,
        );
        await operations.addProjectLogEntry(
          db,
          projectId,
          LogLevel.WARNING,
          `MCP server ${mcpServer.id} requires auth but no auth info found`,
          { mcpServerId: mcpServer.id },
        );
        throw new Error("Auth required but not provided");
      }

      try {
        const authProvider = await getAuthProvider(db, mcpServer);
        const customHeaders = mcpServer.customHeaders;

        let sessionId: string | undefined;
        if (threadId) {
          const mcpSessionInfo = await operations.getMcpThreadSession(
            db,
            threadId,
            mcpServer.id,
          );
          sessionId = mcpSessionInfo?.sessionId;
        }

        const mcpClient = await MCPClient.create(
          mcpServer.url,
          mcpServer.mcpTransport,
          customHeaders,
          authProvider,
          sessionId,
          threadId ? mcpHandlers : {},
        );

        if (
          threadId &&
          mcpClient.sessionId &&
          sessionId !== mcpClient.sessionId
        ) {
          await operations.updateMcpThreadSession(
            db,
            threadId,
            mcpServer.id,
            mcpClient.sessionId,
          );
        }

        return {
          client: mcpClient,
          serverId: mcpServer.id,
          serverKey: mcpServer.serverKey,
          url: mcpServer.url,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(
          `Error processing MCP server ${mcpServer.id} in project ${projectId}: ${err.message}`,
          err.stack,
        );

        await operations.addProjectLogEntry(
          db,
          projectId,
          LogLevel.ERROR,
          `Error processing MCP server ${mcpServer.id}: ${err.message}`,
          { mcpServerId: mcpServer.id, url: mcpServer.url },
        );

        throw err;
      }
    }),
  );

  const mcpClients = results
    .filter(
      (result): result is PromiseFulfilledResult<ThreadMcpClient> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return mcpClients;
}

/** Get the raw MCP servers from the database, query the MCP servers, and convert them to OpenAI tool schemas */
async function getMcpTools(
  db: HydraDb,
  projectId: string,
  threadId: string | null,
  mcpHandlers: MCPHandlers,
): Promise<McpToolRegistry> {
  const mcpClients = await getThreadMCPClients(
    db,
    projectId,
    threadId,
    mcpHandlers,
  );

  const toolResults = await Promise.allSettled(
    mcpClients.map(async ({ client, serverId, serverKey, url }) => {
      try {
        const tools = await client.listTools();
        return { mcpClient: client, tools, serverId, serverKey, url };
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        throw new ListToolsError(err.message, serverId, url, err);
      }
    }),
  );

  const mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
  const mcpToolSources: Record<string, McpToolSource> = {};

  for (const result of toolResults) {
    if (result.status === "rejected") {
      const err =
        result.reason instanceof Error
          ? result.reason
          : new Error(String(result.reason));
      const serverId = err instanceof ListToolsError ? err.serverId : undefined;
      const url = err instanceof ListToolsError ? err.url : undefined;
      logger.error(
        `Error listing tools for MCP server ${serverId ?? "unknown"} (${url ?? "n/a"}) in project ${projectId}: ${err.message}`,
        err.stack,
      );
      await operations.addProjectLogEntry(
        db,
        projectId,
        LogLevel.ERROR,
        `Error listing tools for MCP server ${serverId ?? "unknown"}: ${err.message}`,
        { mcpServerId: serverId, url },
      );
      continue;
    }

    const { mcpClient, tools, serverKey } = result.value;

    mcpTools.push(
      ...tools.map(
        (tool): OpenAI.Chat.Completions.ChatCompletionTool => ({
          type: "function",
          function: {
            name: prefixToolName(serverKey, tool.name),
            description: tool.description,
            strict: true,
            parameters: tool.inputSchema?.properties
              ? {
                  type: "object",
                  properties: tool.inputSchema.properties,
                  required: tool.inputSchema.required,
                  additionalProperties: false,
                }
              : undefined,
          },
        }),
      ),
    );

    for (const tool of tools) {
      mcpToolSources[prefixToolName(serverKey, tool.name)] = {
        client: mcpClient,
        serverKey,
      };
    }
  }

  return {
    mcpToolsSchema: mcpTools,
    mcpToolSources,
    mcpHandlers,
  };
}

function hasAuthInfo(mcpServer: McpServer): boolean {
  if (!mcpServer.contexts.length) {
    return false;
  }
  if (mcpServer.contexts.length > 1) {
    logger.warn(
      `MCP server ${mcpServer.id} has multiple contexts, using the first one`,
    );
  }
  const context = mcpServer.contexts[0];
  if (!context.mcpOauthTokens?.refresh_token || !context.mcpOauthClientInfo) {
    // this is fine, just means this server is not using OAuth
    return false;
  }
  return true;
}

type McpServer = Awaited<
  ReturnType<typeof operations.getProjectMcpServers>
>[number];

async function getAuthProvider(
  db: HydraDb,
  mcpServer: McpServer,
): Promise<OAuthClientProvider | undefined> {
  if (!mcpServer.contexts.length) {
    return undefined;
  }
  if (mcpServer.contexts.length > 1) {
    console.warn(
      `MCP server ${mcpServer.id} has multiple contexts, using the first one`,
    );
  }
  if (!mcpServer.url) {
    return undefined;
  }
  const context = mcpServer.contexts[0];
  if (!mcpServer.mcpRequiresAuth) {
    // this is fine, just means this server is not using OAuth
    return undefined;
  }
  // we need to find the client information for this context
  const client = await db.query.mcpOauthClients.findFirst({
    // TODO: this should really come in from the toolProviderUserContext
    where: eq(schema.mcpOauthClients.toolProviderUserContextId, context.id),
  });
  if (!client) {
    return undefined;
  }

  const authProvider = new OAuthLocalProvider(db, context.id, {
    baseUrl: env.VERCEL_URL ?? "http://localhost:8260",
    serverUrl: mcpServer.url,
    clientInformation: client.sessionInfo.clientInformation,
    sessionId: client.sessionId,
  });
  return authProvider;
}

/**
 * Create a map of resource fetchers from MCP clients, indexed by serverKey.
 * Each fetcher function can be used to read resources from that MCP server.
 *
 * @param mcpClients - Array of MCP client instances with their server keys
 * @returns Map of serverKey to fetcher functions that can fetch resources by URI
 *
 * @example
 * const fetchers = createResourceFetcherMap(mcpClients);
 * const result = await fetchers['github']('github:path/to/file.txt');
 */
export function createResourceFetcherMap(
  mcpClients: ThreadMcpClient[],
): Record<string, (uri: string) => Promise<ReadResourceResult>> {
  const fetchers: Record<string, (uri: string) => Promise<ReadResourceResult>> =
    {};

  for (const { client, serverKey } of mcpClients) {
    if (!serverKey) continue;

    fetchers[serverKey] = async (uri: string) => {
      // Validate that the URI starts with the serverKey prefix
      if (!uri.startsWith(`${serverKey}:`)) {
        throw new Error(`Invalid URI for server ${serverKey}: ${uri}`);
      }
      // Strip the serverKey prefix to get the MCP-native URI
      const mcpUri = uri.slice(serverKey.length + 1);
      return await client.client.readResource({ uri: mcpUri });
    };
  }

  return fetchers;
}
