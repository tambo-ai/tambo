import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Logger } from "@nestjs/common";
import { SystemTools } from "@tambo-ai-cloud/backend";
import { getToolName, LogLevel, MCPClient } from "@tambo-ai-cloud/core";
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

/** Get the tools available for the project */
export async function getSystemTools(
  db: HydraDatabase,
  projectId: string,
): Promise<SystemTools> {
  const { mcpTools, mcpToolSources } = await getMcpTools(db, projectId);

  const mcpToolNames = mcpTools.map((tool) => getToolName(tool));
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
    tools: mcpTools,
    mcpToolSources,
  };
}

async function getMcpTools(
  db: HydraDatabase,
  projectId: string,
): Promise<{
  mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[];
  mcpToolSources: Record<string, MCPClient>;
}> {
  const mcpServers = await operations.getProjectMcpServers(db, projectId, null);

  const mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
  const mcpToolSources: Record<string, MCPClient> = {};

  for (const mcpServer of mcpServers) {
    if (!mcpServer.url) {
      continue;
    }
    if (mcpServer.mcpRequiresAuth && !hasAuthInfo(mcpServer)) {
      console.warn(
        `MCP server ${mcpServer.id} in project ${projectId} requires auth, but no auth info found`,
      );
      // Record as a warning so the user can see it on the dashboard
      await operations.addProjectLogEntry(
        db,
        projectId,
        LogLevel.WARNING,
        `MCP server ${mcpServer.id} requires auth but no auth info found`,
        { mcpServerId: mcpServer.id },
      );
      continue;
    }
    const authProvider = await getAuthProvider(db, mcpServer);
    // Extract custom_headers if they exist
    const customHeaders = mcpServer.customHeaders as
      | Record<string, string>
      | undefined;

    try {
      const mcpClient = await MCPClient.create(
        mcpServer.url,
        mcpServer.mcpTransport,
        customHeaders,
        authProvider,
      );

      const tools = await mcpClient.listTools();

      mcpTools.push(
        ...tools.map(
          (tool): OpenAI.Chat.Completions.ChatCompletionTool => ({
            type: "function",
            function: {
              name: tool.name,
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
        mcpToolSources[tool.name] = mcpClient;
      }
    } catch (error) {
      // TODO: attach this error to the project
      logger.error(
        `Error processing MCP server ${mcpServer.id} in project ${projectId}: ${error}`,
      );

      // Store the error for visibility in the dashboard
      await operations.addProjectLogEntry(
        db,
        projectId,
        LogLevel.ERROR,
        `Error processing MCP server ${mcpServer.id}: ${error instanceof Error ? error.message : String(error)}`,
        { mcpServerId: mcpServer.id },
      );
      continue;
    }
  }

  return { mcpTools, mcpToolSources };
}

function hasAuthInfo(mcpServer: McpServer): boolean {
  if (!mcpServer.contexts.length) {
    return false;
  }
  if (mcpServer.contexts.length > 1) {
    console.warn(
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
    baseUrl: env.VERCEL_URL ?? "http://localhost:3000",
    serverUrl: mcpServer.url,
    clientInformation: client.sessionInfo.clientInformation,
    sessionId: client.sessionId,
  });
  return authProvider;
}
