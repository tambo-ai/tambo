"use client";

import { APIKeySchema } from "@/components/dashboard-components/project-details/api-key-list";
import { ProjectTableSchema } from "@/components/dashboard-components/project-table";
import { api, useTRPCClient } from "@/trpc/react";
import { MCPTransport, OAuthValidationMode } from "@tambo-ai-cloud/core";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";
import { z } from "zod";

/** user management */

/**
 * Zod schema for the `fetchCurrentUser` function.
 * Defines no arguments and a return type as an object containing user details (id, email, createdAt, imageUrl).
 */
export const fetchCurrentUserSchema = z
  .function()
  .args()
  .returns(
    z.object({
      id: z.string(),
      email: z.string().optional(),
      createdAt: z.string(),
      imageUrl: z.string().optional(),
    }),
  );

/** project management */

/**
 * Zod schema for the `fetchAllProjects` function.
 * Defines no arguments and the return type as an object with a `projects` property, which is an array of project details.
 */
export const fetchAllProjectsSchema = z
  .function()
  .args()
  .returns(z.object({ projects: z.array(ProjectTableSchema) }));

/**
 * Zod schema for the `fetchProjectById` function.
 * Defines the argument as a project ID string and the return type as an object containing detailed project information.
 */
export const fetchProjectByIdSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch"))
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
      createdAt: z.string(),
      composioEnabled: z.boolean(),
      customInstructions: z.string().nullable(),
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
      maxToolCallLimit: z.number(),
      isTokenRequired: z.boolean(),
    }),
  );

/**
 * Zod schema for the `updateProject` function.
 * Defines the argument as an object containing project update parameters (ID, name, custom instructions, LLM settings)
 * and the return type as an object representing the updated project details.
 */
export const updateProjectSchema = z
  .function()
  .args(
    z.object({
      id: z.string().describe("The ID of the project to update"),
      name: z.string().describe("The new name of the project"),
      customInstructions: z
        .string()
        .describe("The new custom instructions for the project"),
      defaultLlmProviderName: z
        .string()
        .describe("The new default LLM provider name for the project"),
      defaultLlmModelName: z
        .string()
        .describe("The new default LLM model name for the project"),
      customLlmModelName: z
        .string()
        .describe("The new custom LLM model name for the project"),
      customLlmBaseURL: z
        .string()
        .describe("The new custom LLM base URL for the project"),
      maxInputTokens: z
        .number()
        .describe("The new max input tokens for the project"),
      maxToolCallLimit: z
        .number()
        .optional()
        .describe("The new maximum number of tool calls allowed per response"),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
      customInstructions: z.string().nullable(),
      composioEnabled: z.boolean(),
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
      maxToolCallLimit: z.number(),
      isTokenRequired: z.boolean(),
    }),
  );

/**
 * Zod schema for the `createProject` function.
 * Defines the argument as the project name string and the return type as an object representing the newly created project (id, name, userId).
 */
export const createProjectSchema = z
  .function()
  .args(z.string().describe("The name of the project to create"))
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
    }),
  );

/**
 * Zod schema for the `removeProject` function.
 * Defines the argument as the project ID string and the return type as an object indicating success (e.g., `{ success: true }`).
 */
export const removeProjectSchema = z
  .function()
  .args(z.string().describe("The ID of the project to remove"))
  .returns(z.object({ success: z.boolean() }));

/** tambo API key management */

/**
 * Zod schema for the `fetchProjectApiKeys` function.
 * Defines the argument as a project ID string and the return type as an object with an `apiKeys` property,
 * which is an array of API key details.
 */
export const fetchProjectApiKeysSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch API keys for"))
  .returns(
    z.object({
      apiKeys: z.array(APIKeySchema),
    }),
  );

/**
 * Zod schema for the `generateProjectApiKey` function.
 * Defines arguments as the project ID string and API key name string,
 * and the return type as an object representing the newly generated API key details.
 */
export const generateProjectApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The name of the API key"),
  )
  .returns(
    z.object({
      apiKey: z.string(),
      id: z.string(),
      name: z.string(),
      partiallyHiddenKey: z.string().nullable(),
      lastUsedAt: z.date().nullable(),
      projectId: z.string(),
      hashedKey: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      createdByUserId: z.string(),
    }),
  );

/**
 * Zod schema for the `deleteProjectApiKey` function.
 * Defines arguments as the project ID string and API key ID string,
 * and the return type as an object indicating the key was processed for deletion (e.g., `{ deletedKey: undefined }`).
 */
export const deleteProjectApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The API key ID"),
  )
  .returns(
    z.object({
      deletedKey: z.void(),
    }),
  );

/** dashboard statistics management */

/**
 * Zod schema for the `fetchProjectCount` function.
 * Defines no arguments and returns the count of projects for the current user.
 */
export const fetchProjectCountSchema = z
  .function()
  .args()
  .returns(
    z.object({
      count: z.number(),
    }),
  );

/**
 * Zod schema for the `fetchTotalMessageUsage` function.
 * Defines a period argument and returns total message usage.
 */
export const fetchTotalMessageUsageSchema = z
  .function()
  .args(
    z
      .string()
      .describe(
        "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
      ),
  )
  .returns(
    z.object({
      totalMessages: z.number(),
      period: z.string(),
    }),
  );

/**
 * Zod schema for the `fetchTotalUsers` function.
 * Defines a period argument and returns total user count.
 */
export const fetchTotalUsersSchema = z
  .function()
  .args(
    z
      .string()
      .describe(
        "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
      ),
  )
  .returns(
    z.object({
      totalUsers: z.number(),
      period: z.string(),
    }),
  );

/** llm provider settings management */

/**
 * Zod schema for the `fetchProjectLlmSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing LLM settings.
 */
export const fetchProjectLlmSettingsSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch LLM settings for"))
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
    }),
  );

/**
 * Zod schema for the `updateProjectLlmSettings` function.
 * Defines arguments as the project ID string and an LLM settings object,
 * and the return type as an object representing the updated LLM settings.
 */
export const updateProjectLlmSettingsSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z
      .object({
        defaultLlmProviderName: z.string(),
        defaultLlmModelName: z.string().nullable(),
        customLlmModelName: z.string().nullable(),
        customLlmBaseURL: z.string().nullable(),
        maxInputTokens: z.number().nullable(),
      })
      .describe("The LLM settings to update"),
  )
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
    }),
  );

/** mcp server management */

/**
 * Zod schema for the `fetchProjectMcpServers` function.
 * Defines the argument as a project ID string.
 * The schema's return type is an object representing the details of a single MCP server (as per this schema definition).
 */
export const fetchProjectMcpServersSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch MCP servers for"))
  .returns(
    z.object({
      id: z.string(),
      url: z.string().nullable(),
      customHeaders: z.record(z.string(), z.string()).nullable(),
      mcpRequiresAuth: z.boolean(),
      mcpIsAuthed: z.boolean(),
    }),
  );

/**
 * Zod schema for the `addMcpServer` function.
 * Defines the argument as an object containing parameters for adding an MCP server (project ID, URL, custom headers, MCP transport)
 * and the return type as an object representing the added MCP server's details.
 */
export const addMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      url: z.string().describe("The URL of the MCP server"),
      customHeaders: z
        .record(z.string(), z.string())
        .describe("Custom headers for the MCP server"),
      mcpTransport: z
        .nativeEnum(MCPTransport)
        .describe("Transport mechanism for MCP communication, default is SSE"),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      url: z.string(),
      customHeaders: z.record(z.string(), z.string()),
      mcpTransport: z.nativeEnum(MCPTransport),
      mcpRequiresAuth: z.boolean(),
      mcpCapabilities: z.record(z.string(), z.any()).optional(),
      mcpVersion: z.record(z.string(), z.any()).optional(),
      mcpInstructions: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `deleteMcpServer` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object indicating success.
 */
export const deleteMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to delete"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );

/**
 * Zod schema for the `authorizeMcpServer` function.
 * Defines the argument as an object containing an optional context key and the tool provider ID,
 * and the return type as an object indicating success and an optional redirect URL.
 */
export const authorizeMcpServerSchema = z
  .function()
  .args(
    z.object({
      contextKey: z
        .string()
        .nullable()
        .describe("Optional context key for authorization"),
      toolProviderId: z
        .string()
        .describe("The ID of the MCP server to authorize"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
      redirectUrl: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `getMcpServerTools` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object containing available tools and server information.
 */
export const getMcpServerToolsSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to inspect"),
    }),
  )
  .returns(
    z.object({
      tools: z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z.any().optional(),
      }),
      serverInfo: z.object({
        version: z.record(z.string(), z.any()).optional(),
        instructions: z.string().optional(),
        capabilities: z.record(z.string(), z.any()).optional(),
      }),
    }),
  );

/** oauth validation settings management */

/**
 * Zod schema for the `fetchOAuthValidationSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing OAuth validation settings.
 */
export const fetchOAuthValidationSettingsSchema = z
  .function()
  .args(
    z
      .string()
      .describe("The project ID to fetch OAuth validation settings for"),
  )
  .returns(
    z.object({
      mode: z
        .nativeEnum(OAuthValidationMode)
        .describe("The OAuth validation mode"),
      publicKey: z
        .string()
        .nullable()
        .describe("The public key for asymmetric validation"),
      hasSecretKey: z
        .boolean()
        .describe("Whether a secret key is stored for symmetric validation"),
    }),
  );

/**
 * Zod schema for the `updateOAuthValidationSettings` function.
 * Defines arguments as the project ID string and OAuth validation settings object,
 * and the return type as an object representing the updated OAuth validation settings.
 */
export const updateOAuthValidationSettingsSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z
      .object({
        mode: z
          .nativeEnum(OAuthValidationMode)
          .describe("The OAuth validation mode"),
        secretKey: z
          .string()
          .optional()
          .describe("The secret key for symmetric validation"),
        publicKey: z
          .string()
          .optional()
          .describe("The public key for asymmetric manual validation"),
      })
      .describe("The OAuth validation settings to update"),
  )
  .returns(
    z.object({
      mode: z.nativeEnum(OAuthValidationMode),
      publicKey: z.string().nullable(),
      hasSecretKey: z.boolean(),
    }),
  );

export function useTamboManagementTools() {
  const { registerTool } = useTambo();
  const trpcClient = useTRPCClient();
  const utils = api.useUtils();

  /* user management */
  useEffect(() => {
    /**
     * Registers a tool to fetch the current user information.
     * Returns user details including ID, email, creation date, and image URL.
     * If the user is not logged in, provides a link to the login page.
     */
    registerTool({
      name: "fetchCurrentUser",
      description:
        "Fetches the current user. If the user is not logged in, return a link that leads to the login page at /login",
      tool: async () => {
        return await trpcClient.user.getUser.query();
      },
      toolSchema: fetchCurrentUserSchema,
    });

    /* project management */

    /**
     * Registers a tool to fetch all projects for the current user.
     * Returns an array of project objects with detailed information.
     */
    registerTool({
      name: "fetchAllProjects",
      description: "Fetches all projects for the current user.",
      tool: async () => {
        return await trpcClient.project.getUserProjects.query();
      },
      toolSchema: fetchAllProjectsSchema,
    });

    /**
     * Registers a tool to fetch a specific project by its ID.
     * @param {string} projectId - The unique identifier of the project to fetch
     * @returns {Object} Project details including ID, name, user ID, settings, and timestamps
     */
    registerTool({
      name: "fetchProjectById",
      description: "Fetches a specific project by ID.",
      tool: async (projectId: string) => {
        const projects = await trpcClient.project.getUserProjects.query();
        return projects.find((p: { id: string }) => p.id === projectId);
      },
      toolSchema: fetchProjectByIdSchema,
    });

    /**
     * Registers a tool to update an existing project's configuration.
     * Updates project name, custom instructions, and LLM provider settings.
     * @param {Object} params - Project update parameters
     * @param {string} params.projectId - The ID of the project to update
     * @param {string} params.projectName - The new name for the project
     * @param {string} params.customInstructions - Custom AI instructions for the project
     * @param {string} params.defaultLlmProviderName - Default LLM provider name
     * @param {string} params.defaultLlmModelName - Default LLM model name
     * @param {string} params.customLlmModelName - Custom LLM model name
     * @param {string} params.customLlmBaseURL - Custom LLM base URL
     * @param {number} params.maxInputTokens - Maximum input tokens for the project
     * @param {number} params.maxToolCallLimit - Maximum tool calls allowed per response (optional)
     * @returns {Object} Updated project details
     */
    registerTool({
      name: "updateProject",
      description: "Updates a project.",
      tool: async (params: {
        id: string;
        name: string;
        customInstructions: string;
        defaultLlmProviderName: string;
        defaultLlmModelName: string;
        customLlmModelName: string;
        customLlmBaseURL: string;
        maxInputTokens: number;
        maxToolCallLimit?: number;
      }) => {
        const result = await trpcClient.project.updateProject.mutate({
          projectId: params.id,
          name: params.name,
          customInstructions: params.customInstructions,
          defaultLlmProviderName: params.defaultLlmProviderName,
          defaultLlmModelName: params.defaultLlmModelName,
          customLlmModelName: params.customLlmModelName,
          customLlmBaseURL: params.customLlmBaseURL,
          maxInputTokens: params.maxInputTokens,
          ...(params.maxToolCallLimit !== undefined && {
            maxToolCallLimit: params.maxToolCallLimit,
          }),
        });

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return result;
      },
      toolSchema: updateProjectSchema,
    });

    /**
     * Registers a tool to create a new project.
     * @param {string} projectName - The name for the new project
     * @returns {Object} Created project details with ID, name, and user ID
     */
    registerTool({
      name: "createProject",
      description: "create a new project",
      tool: async (projectName: string) => {
        const result =
          await trpcClient.project.createProject.mutate(projectName);

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return result;
      },
      toolSchema: createProjectSchema,
    });

    /**
     * Registers a tool to remove/delete a project.
     * @param {string} projectId - The ID of the project to remove
     * @returns {Object} Success status indicating the project was deleted
     */
    registerTool({
      name: "removeProject",
      description: "remove a project",
      tool: async (projectId: string) => {
        await trpcClient.project.removeProject.mutate(projectId);

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return { success: true };
      },
      toolSchema: removeProjectSchema,
    });

    /* tambo API key management */

    /**
     * Registers a tool to fetch all API keys for a specific project.
     * @param {string} projectId - The project ID to fetch API keys for
     * @returns {Object} Object containing an array of API key details
     */
    registerTool({
      name: "fetchProjectApiKeys",
      description: "get all api keys for the current project",
      tool: async (projectId: string) => {
        return await trpcClient.project.getApiKeys.query(projectId);
      },
      toolSchema: fetchProjectApiKeysSchema,
    });

    /**
     * Registers a tool to generate a new API key for a project.
     * @param {string} projectId - The project ID to generate an API key for
     * @param {string} name - The name/label for the new API key
     * @returns {Object} Generated API key details including the key value and metadata
     */
    registerTool({
      name: "generateProjectApiKey",
      description: "generate a new api key for the current project",
      tool: async (projectId: string, name: string) => {
        const result = await trpcClient.project.generateApiKey.mutate({
          projectId,
          name,
        });

        // Invalidate the API keys cache to refresh the component
        await utils.project.getApiKeys.invalidate(projectId);

        return result;
      },
      toolSchema: generateProjectApiKeySchema,
    });

    /**
     * Registers a tool to delete an existing API key from a project.
     * @param {string} projectId - The project ID containing the API key
     * @param {string} apiKeyId - The ID of the API key to delete
     * @returns {Object} Confirmation message that the key was deleted
     */
    registerTool({
      name: "deleteProjectApiKey",
      description: "delete an api key for the current project",
      tool: async (projectId: string, apiKeyId: string) => {
        await trpcClient.project.removeApiKey.mutate({
          projectId,
          apiKeyId,
        });

        // Invalidate the API keys cache to refresh the component
        await utils.project.getApiKeys.invalidate(projectId);

        return { deletedKey: "The key was deleted successfully." };
      },
      toolSchema: deleteProjectApiKeySchema,
    });

    /* dashboard statistics management */

    /**
     * Registers a tool to fetch the total number of projects for the current user.
     * Returns the count of projects associated with the user's account.
     * @returns {Object} Object containing the project count
     */
    registerTool({
      name: "fetchProjectCount",
      description: "Fetches the total number of projects for the current user.",
      tool: async () => {
        const projects = await trpcClient.project.getUserProjects.query();
        return { count: projects.length };
      },
      toolSchema: fetchProjectCountSchema,
    });

    /**
     * Registers a tool to fetch total message usage statistics.
     * @param {string} period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
     * @returns {Object} Object containing total message count and period
     */
    registerTool({
      name: "fetchTotalMessageUsage",
      description:
        "Fetches total message usage statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
      tool: async (period: string) => {
        // Use 'all time' as default if period is not provided or invalid
        const validPeriod = period || "all time";
        const result = await trpcClient.project.getTotalMessageUsage.query({
          period: validPeriod,
        });
        return {
          totalMessages: result.totalMessages,
          period: validPeriod,
        };
      },
      toolSchema: fetchTotalMessageUsageSchema,
    });

    /**
     * Registers a tool to fetch total user count statistics.
     * @param {string} period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
     * @returns {Object} Object containing total user count and period
     */
    registerTool({
      name: "fetchTotalUsers",
      description:
        "Fetches total user count statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
      tool: async (period: string) => {
        // Use 'all time' as default if period is not provided or invalid
        const validPeriod = period || "all time";
        const result = await trpcClient.project.getTotalUsers.query({
          period: validPeriod,
        });
        return {
          totalUsers: result.totalUsers,
          period: validPeriod,
        };
      },
      toolSchema: fetchTotalUsersSchema,
    });

    /* llm provider settings management */

    /**
     * Registers a tool to fetch LLM configuration settings for a project.
     * Returns the current LLM provider, model, and custom settings.
     * @param {string} projectId - The project ID to fetch LLM settings for
     * @returns {Object} LLM configuration including provider, model, and custom settings
     */
    registerTool({
      name: "fetchProjectLlmSettings",
      description: "Fetches LLM configuration settings for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.project.getProjectLlmSettings.query({
          projectId,
        });
      },
      toolSchema: fetchProjectLlmSettingsSchema,
    });

    /**
     * Registers a tool to update LLM configuration settings for a project.
     * Updates the default LLM provider, model, and custom configurations.
     * Note: Always show ProviderKeySection component after calling this tool.
     * @param {string} projectId - The project ID to update
     * @param {Object} settings - LLM configuration settings to update
     * @param {string} settings.defaultLlmProviderName - The LLM provider name (e.g., 'openai', 'anthropic')
     * @param {string|null} settings.defaultLlmModelName - The default model name
     * @param {string|null} settings.customLlmModelName - Custom model name if using custom provider
     * @param {string|null} settings.customLlmBaseURL - Custom base URL for LLM API
     * @returns {Object} Updated LLM configuration settings
     */
    registerTool({
      name: "updateProjectLlmSettings",
      description:
        "Updates LLM configuration settings for a project. Always show ProviderKeySection component after calling this tool.",
      tool: async (
        projectId: string,
        settings: {
          defaultLlmProviderName: string;
          defaultLlmModelName: string | null;
          customLlmModelName: string | null;
          customLlmBaseURL: string | null;
          maxInputTokens: number | null;
        },
      ) => {
        const result = await trpcClient.project.updateProjectLlmSettings.mutate(
          {
            projectId: projectId,
            defaultLlmProviderName: settings.defaultLlmProviderName,
            defaultLlmModelName: settings.defaultLlmModelName,
            customLlmModelName: settings.customLlmModelName,
            customLlmBaseURL: settings.customLlmBaseURL,
            maxInputTokens: settings.maxInputTokens,
          },
        );

        // Invalidate the llm settings cache to refresh the component
        await utils.project.getProjectLlmSettings.invalidate({ projectId });

        return result;
      },
      toolSchema: updateProjectLlmSettingsSchema,
    });

    /* mcp server management */

    /**
     * Registers a tool to fetch all MCP (Model Context Protocol) servers for a project.
     * Returns server configuration including URL, headers, and authentication status.
     * @param {string} projectId - The project ID to fetch MCP servers for
     * @returns {Object} MCP server details including ID, URL, headers, and auth status
     */
    registerTool({
      name: "fetchProjectMcpServers",
      description: "Fetches MCP servers for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.tools.listMcpServers.query({ projectId });
      },
      toolSchema: fetchProjectMcpServersSchema,
    });

    /**
     * Registers a tool to add a new MCP server to a project.
     * @param {string} projectId - The project ID to add the MCP server to
     * @param {Object} server - MCP server configuration
     * @param {string} server.url - The URL of the MCP server
     * @param {Record<string, string>} server.customHeaders - Custom HTTP headers for the server
     * @param {MCPTransport} server.mcpTransport - Transport mechanism (e.g., SSE, WebSocket)
     * @returns {Object} Created MCP server details including capabilities and version info
     */
    registerTool({
      name: "addMcpServer",
      description: "Adds a new MCP server to a project.",
      tool: async (params: {
        projectId: string;
        url: string;
        customHeaders: Record<string, string>;
        mcpTransport: MCPTransport;
      }) => {
        const result = await trpcClient.tools.addMcpServer.mutate({
          projectId: params.projectId,
          url: params.url,
          customHeaders: params.customHeaders,
          mcpTransport: params.mcpTransport,
        });

        // Invalidate the mcp server cache to refresh the component
        await utils.tools.listMcpServers.invalidate({
          projectId: params.projectId,
        });

        return result;
      },
      toolSchema: addMcpServerSchema,
    });

    /**
     * Registers a tool to delete an MCP server from a project.
     * @param {Object} params - Deletion parameters
     * @param {string} params.projectId - The project ID containing the MCP server
     * @param {string} params.serverId - The ID of the MCP server to delete
     * @returns {Object} Success status indicating the server was deleted
     */
    registerTool({
      name: "deleteMcpServer",
      description: "Deletes an MCP server for a project.",
      tool: async (params: { projectId: string; serverId: string }) => {
        await trpcClient.tools.deleteMcpServer.mutate({
          projectId: params.projectId,
          serverId: params.serverId,
        });

        // Invalidate the mcp server cache to refresh the component
        await utils.tools.listMcpServers.invalidate({
          projectId: params.projectId,
        });

        return { success: true };
      },
      toolSchema: deleteMcpServerSchema,
    });

    /**
     * Registers a tool to authorize an MCP server for access to external services.
     * Handles OAuth flows and other authentication mechanisms for MCP servers.
     * @param {Object} params - Authorization parameters
     * @param {string|null} params.contextKey - Optional context key for authorization flow
     * @param {string} params.toolProviderId - The ID of the MCP server to authorize
     * @returns {Object} Authorization result with success status and optional redirect URL
     */
    registerTool({
      name: "authorizeMcpServer",
      description: "Authorizes an MCP server for a project.",
      tool: async (params: {
        contextKey: string | null;
        toolProviderId: string;
      }) => {
        const authResult = await trpcClient.tools.authorizeMcpServer.mutate({
          contextKey: params.contextKey,
          toolProviderId: params.toolProviderId,
        });
        return authResult;
      },
      toolSchema: authorizeMcpServerSchema,
    });

    /**
     * Registers a tool to inspect and get available tools from an MCP server.
     * Returns the tools/capabilities exposed by the MCP server along with server information.
     * @param {Object} params - Inspection parameters
     * @param {string} params.projectId - The project ID containing the MCP server
     * @param {string} params.serverId - The ID of the MCP server to inspect
     * @returns {Object} Available tools and server information including capabilities and version
     */
    registerTool({
      name: "getMcpServerTools",
      description: "Gets the tools for an MCP server for a project.",
      tool: async (params: { projectId: string; serverId: string }) => {
        return await trpcClient.tools.inspectMcpServer.query({
          projectId: params.projectId,
          serverId: params.serverId,
        });
      },
      toolSchema: getMcpServerToolsSchema,
    });

    /* oauth validation settings management */

    /**
     * Registers a tool to fetch OAuth validation settings for a project.
     * Returns the current OAuth validation mode, public key, and secret key status.
     * @param {string} projectId - The project ID to fetch OAuth validation settings for
     * @returns {Object} OAuth validation settings including mode, public key, and secret key status
     */
    registerTool({
      name: "fetchOAuthValidationSettings",
      description: "Fetches OAuth validation settings for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.project.getOAuthValidationSettings.query({
          projectId,
        });
      },
      toolSchema: fetchOAuthValidationSettingsSchema,
    });

    /**
     * Registers a tool to update OAuth validation settings for a project.
     * Updates the OAuth validation mode and associated keys (secret key for symmetric, public key for asymmetric manual).
     * @param {string} projectId - The project ID to update
     * @param {Object} settings - OAuth validation settings to update
     * @param {OAuthValidationMode} settings.mode - The OAuth validation mode
     * @param {string} settings.secretKey - The secret key for symmetric validation (optional)
     * @param {string} settings.publicKey - The public key for asymmetric manual validation (optional)
     * @returns {Object} Updated OAuth validation settings
     */
    registerTool({
      name: "updateOAuthValidationSettings",
      description: "Updates OAuth validation settings for a project.",
      tool: async (
        projectId: string,
        settings: {
          mode: OAuthValidationMode;
          secretKey?: string;
          publicKey?: string;
        },
      ) => {
        const result =
          await trpcClient.project.updateOAuthValidationSettings.mutate({
            projectId: projectId,
            mode: settings.mode,
            secretKey: settings.secretKey,
            publicKey: settings.publicKey,
          });

        // Invalidate the OAuth settings cache to refresh the component
        await utils.project.getOAuthValidationSettings.invalidate({
          projectId,
        });

        return result;
      },
      toolSchema: updateOAuthValidationSettingsSchema,
    });
  }, [registerTool, trpcClient, utils]);
}
