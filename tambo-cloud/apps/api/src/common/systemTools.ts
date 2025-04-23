import { MCPClient, SystemTools } from "@tambo-ai-cloud/backend";
import { HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { OpenAIToolSet } from "composio-core";
import OpenAI from "openai";

/** Get the tools available for the project */
export async function getSystemTools(
  db: HydraDatabase,
  projectId: string,
): Promise<SystemTools> {
  const { mcpTools, mcpToolSources } = await getMcpTools(db, projectId);

  const { composioTools, composioClient } = await getComposioTools(
    db,
    projectId,
  );

  const mcpToolNames = mcpTools.map((tool) => tool.function.name);
  const composioToolNames = composioTools.map((tool) => tool.function.name);
  // make sure there are no name conflicts
  const toolNames = [...mcpToolNames, ...composioToolNames];
  if (new Set(toolNames).size !== toolNames.length) {
    const duplicateToolNames = toolNames.filter(
      (toolName, index) => toolNames.indexOf(toolName) !== index,
    );
    console.warn(
      `Tool names must be unique, found duplicates for project ${projectId}: ${duplicateToolNames.join(
        ", ",
      )}`,
    );
  }
  return {
    tools: [...mcpTools, ...composioTools],
    mcpToolSources,
    composioClient,
  };
}
async function getMcpTools(
  db: HydraDatabase,
  projectId: string,
): Promise<{
  mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[];
  mcpToolSources: Record<string, MCPClient>;
}> {
  const mcpServers = await operations.getProjectMcpServers(db, projectId);

  const mcpTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
  const mcpToolSources: Record<string, MCPClient> = {};
  for (const mcpServer of mcpServers) {
    if (!mcpServer.url) {
      continue;
    }
    // Extract custom_headers if they exist
    const customHeaders = mcpServer.customHeaders as
      | Record<string, string>
      | undefined;

    const mcpClient = await MCPClient.create(mcpServer.url, customHeaders);
    const tools = await mcpClient.listTools();
    mcpTools.push(
      ...tools.map(
        (tool): OpenAI.Chat.Completions.ChatCompletionTool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema?.properties
              ? {
                  type: "object",
                  properties: tool.inputSchema?.properties,
                }
              : undefined,
          },
        }),
      ),
    );

    for (const tool of tools) {
      mcpToolSources[tool.name] = mcpClient;
    }
  }
  return { mcpTools, mcpToolSources };
}

async function getComposioTools(
  db: HydraDatabase,
  projectId: string,
): Promise<{
  composioTools: OpenAI.Chat.Completions.ChatCompletionTool[];
  composioClient?: OpenAIToolSet;
}> {
  const composioApps = await operations.getComposioApps(db, projectId);
  if (!composioApps.length) {
    return { composioTools: [], composioClient: undefined };
  }
  const composioTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
  const appIds = composioApps
    .map((app) => app.composioAppId)
    .filter((appId): appId is string => !!appId);
  const composioClient = new OpenAIToolSet();

  const tools = await composioClient.getTools({ apps: appIds });

  for (const tool of tools) {
    composioTools.push({
      type: "function",
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    });
  }
  return { composioTools, composioClient };
}
