"use server";

import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { MCPTransport } from "@tambo-ai-cloud/core";

/**
 * Creates a TRPC caller instance with the current context.
 * @returns A TRPC caller instance.
 */
export async function getCaller() {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  const caller = createCaller(ctx);
  return caller;
}

/** user management */

/**
 * Fetches the current authenticated user details.
 * @returns {Promise<User>} User details or authentication error.
 */
export async function fetchCurrentUser() {
  const caller = await getCaller();
  const user = await caller.user.getUser();
  return user;
}

/** project management */

/**
 * Fetches all projects associated with the authenticated user.
 * @returns {Promise<Project[]>} List of user projects or authentication error.
 */
export async function fetchAllProjects() {
  const caller = await getCaller();
  const projects = await caller.project.getUserProjects();
  return projects;
}

/**
 * Fetches a specific project by ID.
 * @param {string} projectId - ID of the project to fetch.
 * @returns {Promise<Project | undefined>} Project details or undefined if not found, or an authentication error.
 */
export async function fetchProjectById(projectId: string) {
  const caller = await getCaller();
  const projects = await caller.project.getUserProjects();
  // Narrow the parameter type to avoid an implicit-any error
  const project = projects.find((p: { id: string }) => p.id === projectId);
  return project;
}

/**
 * Updates a project with new name, custom instructions, and LLM settings.
 * @param {object} params - The project update parameters.
 * @param {string} params.id - ID of the project to update.
 * @param {string} params.name - New name for the project.
 * @param {string} params.customInstructions - New custom instructions for the project.
 * @param {string} params.defaultLlmProviderName - New default LLM provider name.
 * @param {string} params.defaultLlmModelName - New default LLM model name.
 * @param {string} params.customLlmModelName - New custom LLM model name (if applicable).
 * @param {string} params.customLlmBaseURL - New custom LLM base URL (if applicable).
 * @returns {Promise<Project>} Updated project details or error.
 */
export async function updateProject(params: {
  id: string;
  name: string;
  customInstructions: string;
  defaultLlmProviderName: string;
  defaultLlmModelName: string;
  customLlmModelName: string;
  customLlmBaseURL: string;
}) {
  const caller = await getCaller();
  const updatedProject = await caller.project.updateProject({
    projectId: params.id,
    name: params.name,
    customInstructions: params.customInstructions,
    defaultLlmProviderName: params.defaultLlmProviderName,
    defaultLlmModelName: params.defaultLlmModelName,
    customLlmModelName: params.customLlmModelName,
    customLlmBaseURL: params.customLlmBaseURL,
  });
  return updatedProject;
}

/**
 * Creates a new project with a simple name.
 * @param {string} name - Name of the project.
 * @returns {Promise<Project>} Newly created project or error.
 */
export async function createProject(name: string) {
  const caller = await getCaller();
  const project = await caller.project.createProject(name);
  return project;
}

/**
 * Removes a project by ID.
 * @param {string} projectId - ID of the project to remove.
 * @returns {Promise<{ success: true }>} Success status or error.
 */
export async function removeProject(projectId: string) {
  const caller = await getCaller();
  await caller.project.removeProject(projectId);
  return { success: true };
}

/** tambo API key management */

/**
 * Retrieves API keys for a specific project.
 * @param {string} projectId - ID of the project to fetch API keys for.
 * @returns {Promise<ApiKey[]>} List of API keys or authentication error.
 */
export async function fetchProjectApiKeys(projectId: string) {
  const caller = await getCaller();
  const apiKeys = await caller.project.getApiKeys(projectId);
  return apiKeys;
}

/**
 * Generates a new API key for a project.
 * @param {string} projectId - ID of the project.
 * @param {string} name - Name for the new API key.
 * @returns {Promise<ApiKey>} Newly created API key or error.
 */
export async function generateProjectApiKey(projectId: string, name: string) {
  const caller = await getCaller();
  const newKey = await caller.project.generateApiKey({
    projectId,
    name,
  });
  return newKey;
}

/**
 * Deletes an API key from a project.
 * @param {string} projectId - ID of the project containing the API key.
 * @param {string} apiKeyId - ID of the API key to delete.
 * @returns {Promise<{ deletedKey: undefined }>} Object indicating the key was processed for deletion or error.
 */
export async function deleteProjectApiKey(projectId: string, apiKeyId: string) {
  const caller = await getCaller();
  const deletedKey = await caller.project.removeApiKey({
    projectId,
    apiKeyId,
  });
  return { deletedKey };
}

/** llm provider settings management */

/**
 * Fetches LLM settings for a project.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<ProjectLlmSettings>} LLM settings or error.
 */
export async function fetchProjectLlmSettings(projectId: string) {
  const caller = await getCaller();
  const llmSettings = await caller.project.getProjectLlmSettings({
    projectId,
  });
  return llmSettings;
}

/**
 * Updates LLM settings for a project.
 * @param {string} projectId - ID of the project.
 * @param {object} settings - Object containing LLM settings to update.
 * @param {string} settings.defaultLlmProviderName - The default LLM provider name.
 * @param {string | null} settings.defaultLlmModelName - The default LLM model name.
 * @param {string | null} settings.customLlmModelName - The custom LLM model name.
 * @param {string | null} settings.customLlmBaseURL - The custom LLM base URL.
 * @returns {Promise<ProjectLlmSettings>} Updated settings or error.
 */
export async function updateProjectLlmSettings(
  projectId: string,
  settings: {
    defaultLlmProviderName: string;
    defaultLlmModelName: string | null;
    customLlmModelName: string | null;
    customLlmBaseURL: string | null;
  },
) {
  const caller = await getCaller();
  const updatedSettings = await caller.project.updateProjectLlmSettings({
    projectId: projectId,
    defaultLlmProviderName: settings.defaultLlmProviderName,
    defaultLlmModelName: settings.defaultLlmModelName,
    customLlmModelName: settings.customLlmModelName,
    customLlmBaseURL: settings.customLlmBaseURL,
  });
  return updatedSettings;
}

/** MCP server management */

/**
 * Fetches MCP servers for a project.
 * @param {string} projectId - ID of the project.
 * @returns {Promise<McpServer[]>} List of MCP servers or error.
 */
export async function fetchProjectMcpServers(projectId: string) {
  const caller = await getCaller();
  const mcpServers = await caller.tools.listMcpServers({
    projectId,
  });
  return mcpServers;
}

/**
 * Adds a new MCP server to a project.
 * @param {object} params - Parameters for adding an MCP server.
 * @param {string} params.projectId - ID of the project.
 * @param {string} params.url - URL of the MCP server.
 * @param {Record<string, string>} params.customHeaders - Custom headers for the MCP server.
 * @param {MCPTransport} params.mcpTransport - Transport mechanism for MCP communication.
 * @returns {Promise<McpServer>} Added MCP server or error.
 */
export async function addMcpServer({
  projectId,
  url,
  customHeaders,
  mcpTransport,
}: {
  projectId: string;
  url: string;
  customHeaders: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  const caller = await getCaller();
  const mcpServer = await caller.tools.addMcpServer({
    projectId,
    url,
    customHeaders,
    mcpTransport,
  });
  return mcpServer;
}

/**
 * Updates an existing MCP server.
 * @param {object} params - Parameters for updating an MCP server.
 * @param {string} params.projectId - ID of the project.
 * @param {string} params.serverId - ID of the MCP server to update.
 * @param {string} params.url - New URL for the MCP server.
 * @param {Record<string, string>} params.customHeaders - New custom headers for the MCP server.
 * @param {MCPTransport} params.mcpTransport - New transport mechanism for MCP communication.
 * @returns {Promise<McpServer>} Updated MCP server or error.
 */
export async function updateMcpServer({
  projectId,
  serverId,
  url,
  customHeaders,
  mcpTransport,
}: {
  projectId: string;
  serverId: string;
  url: string;
  customHeaders: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  const caller = await getCaller();
  const mcpServer = await caller.tools.updateMcpServer({
    projectId,
    serverId,
    url,
    customHeaders,
    mcpTransport,
  });
  return mcpServer;
}

/**
 * Deletes an MCP server.
 * @param {object} params - Parameters for deleting an MCP server.
 * @param {string} params.projectId - ID of the project.
 * @param {string} params.serverId - ID of the MCP server to delete.
 * @returns {Promise<{ success: true }>} Success status or error.
 */
export async function deleteMcpServer({
  projectId,
  serverId,
}: {
  projectId: string;
  serverId: string;
}) {
  const caller = await getCaller();
  await caller.tools.deleteMcpServer({
    projectId,
    serverId,
  });
  return { success: true };
}

/**
 * Authorizes an MCP server.
 * @param {object} params - Parameters for authorizing an MCP server.
 * @param {string | null} params.contextKey - Optional context key for authorization.
 * @param {string} params.toolProviderId - ID of the MCP server to authorize.
 * @returns {Promise<AuthorizationResult>} Authorization result or error.
 */
export async function authorizeMcpServer({
  contextKey,
  toolProviderId,
}: {
  contextKey: string | null;
  toolProviderId: string;
}) {
  const caller = await getCaller();
  const authResult = await caller.tools.authorizeMcpServer({
    contextKey,
    toolProviderId,
  });
  return authResult;
}

/**
 * Inspects an MCP server to get available tools.
 * @param {object} params - Parameters for inspecting an MCP server.
 * @param {string} params.projectId - ID of the project.
 * @param {string} params.serverId - ID of the MCP server to inspect.
 * @returns {Promise<ToolInfo>} List of available tools or error.
 */
export async function getMcpServerTools({
  projectId,
  serverId,
}: {
  projectId: string;
  serverId: string;
}) {
  const caller = await getCaller();
  const toolInfo = await caller.tools.inspectMcpServer({
    projectId,
    serverId,
  });
  return toolInfo;
}
