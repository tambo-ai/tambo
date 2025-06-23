"use client";

import { APIKeySchema } from "@/components/dashboard-components/project-details/api-key-list";
import { ProjectTableSchema } from "@/components/dashboard-components/project-table";
import { DeprecatedComposioAuthMode, MCPTransport } from "@tambo-ai-cloud/core";
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
      })
      .describe("The LLM settings to update"),
  )
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
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
 * Zod schema for the `updateMcpServer` function.
 * Defines the argument as an object containing parameters for updating an MCP server (project ID, server ID, URL, custom headers, MCP transport)
 * and the return type as an object representing the updated MCP server's details.
 */
export const updateMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to update"),
      url: z.string().describe("The updated URL of the MCP server"),
      customHeaders: z
        .record(z.string(), z.string())
        .describe("Updated custom headers for the MCP server"),
      mcpTransport: z
        .nativeEnum(MCPTransport)
        .describe("Updated transport mechanism for MCP communication"),
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

/**
 * Zod schema for the `checkComposioConnectedAccountStatus` function.
 * Defines the argument as an object containing the project ID, tool provider ID, and an optional context key,
 * and the return type as an object representing the connection status (discriminated union based on status).
 */
export const checkComposioConnectedAccountStatusSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      toolProviderId: z
        .string()
        .describe("The ID of the tool provider to check"),
      contextKey: z
        .string()
        .nullable()
        .describe("Optional context key for the authentication"),
    }),
  )
  .returns(
    z.discriminatedUnion("status", [
      z.object({
        status: z.literal("NOT_CONNECTED"),
        lastCheckedAt: z.undefined().optional(),
      }),
      z.object({
        status: z.enum(["INITIATED", "ACTIVE", "FAILED", "EXPIRED"]),
        lastCheckedAt: z.date(),
      }),
    ]),
  );

// BELOW TOOLS ARE NOT TESTED YET

/**
 * Zod schema for the `listAvailableApps` function.
 * Defines the argument as an object containing the project ID.
 * The schema's return type is an object representing the details of a single available app (as per this schema definition).
 */
export const listAvailableAppsSchema = z
  .function()
  .args(
    z.object({
      projectId: z
        .string()
        .describe("The project ID to fetch available apps for"),
    }),
  )
  .returns(
    z.object({
      appId: z.string(),
      name: z.string(),
      no_auth: z.boolean().optional(),
      auth_schemes: z.array(
        z.object({
          mode: z.nativeEnum(DeprecatedComposioAuthMode),
          name: z.string().optional(),
          proxy: z.object({
            base_url: z.string(),
            headers: z.record(z.string(), z.string()).optional(),
          }),
          fields: z.array(
            z.object({
              name: z.string(),
              type: z.string(),
              required: z.boolean(),
              description: z.string(),
            }),
          ),
        }),
      ),
      tags: z.array(z.string()),
      logo: z.string(),
      description: z.string(),
      enabled: z.boolean(),
    }),
  );

/**
 * Zod schema for the `enableApp` function.
 * Defines the argument as an object containing the project ID and app ID,
 * and the return type as an object indicating success.
 */
export const enableAppSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      appId: z.string().describe("The ID of the app to enable"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );

/**
 * Zod schema for the `disableApp` function.
 * Defines the argument as an object containing the project ID and app ID,
 * and the return type as an object indicating success.
 */
export const disableAppSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      appId: z.string().describe("The ID of the app to disable"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );

/**
 * Zod schema for the `getComposioAuth` function.
 * Defines the argument as an object containing the project ID, app ID, and an optional context key,
 * and the return type as an object containing Composio authentication details.
 */
export const getComposioAuthSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      appId: z.string().describe("The ID of the app to get authentication for"),
      contextKey: z
        .string()
        .nullable()
        .describe("Optional context key for the authentication"),
    }),
  )
  .returns(
    z.object({
      mode: z.nativeEnum(DeprecatedComposioAuthMode).nullable(),
      fields: z.record(z.string(), z.string()),
      redirectUrl: z.string().nullable(),
      status: z.string().nullable(),
      toolProviderId: z.string(),
      integrationId: z.string().nullable(),
      connectedAccountId: z.string().nullable(),
    }),
  );

/**
 * Zod schema for the `updateComposioAuth` function.
 * Defines the argument as an object containing parameters for updating Composio authentication (project ID, app ID, context key, auth mode, auth fields),
 * and the return type as an object indicating success.
 */
export const updateComposioAuthSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      appId: z
        .string()
        .describe("The ID of the app to update authentication for"),
      contextKey: z
        .string()
        .nullable()
        .describe("Optional context key for the authentication"),
      authMode: z
        .nativeEnum(DeprecatedComposioAuthMode)
        .describe("Authentication mode to use"),
      authFields: z
        .record(z.string(), z.string())
        .describe("Authentication field values"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );
