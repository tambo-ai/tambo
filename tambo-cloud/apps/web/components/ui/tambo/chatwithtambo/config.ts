"use client";

import {
  addMcpServer,
  authorizeMcpServer,
  checkComposioConnectedAccountStatus,
  createProject,
  deleteMcpServer,
  deleteProjectApiKey,
  fetchAllProjects,
  fetchCurrentUser,
  fetchProjectApiKeys,
  fetchProjectById,
  fetchProjectMcpServers,
  generateProjectApiKey,
  getMcpServerTools,
  removeProject,
  updateMcpServer,
  updateProject,
  fetchProjectLlmSettings,
  updateProjectLlmSettings,
} from "@/app/(authed)/utils/project-utils";
import { TamboTool } from "@tambo-ai/react";
import {
  addMcpServerSchema,
  authorizeMcpServerSchema,
  checkComposioConnectedAccountStatusSchema,
  createProjectSchema,
  deleteMcpServerSchema,
  deleteProjectApiKeySchema,
  fetchAllProjectsSchema,
  fetchCurrentUserSchema,
  fetchProjectApiKeysSchema,
  fetchProjectByIdSchema,
  fetchProjectMcpServersSchema,
  generateProjectApiKeySchema,
  getMcpServerToolsSchema,
  removeProjectSchema,
  updateMcpServerSchema,
  fetchProjectLlmSettingsSchema,
  updateProjectLlmSettingsSchema,
  updateProjectSchema,
} from "./tools";
import {
  ProjectTable,
  ProjectTableProps,
} from "@/components/dashboard-components/project-table";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  APIKeyList,
  APIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";
import {
  ProviderKeySection,
  ProviderKeySectionProps,
} from "@/components/dashboard-components/project-details/provider-key-section";
import {
  CustomInstructionsEditor,
  CustomInstructionsEditorProps,
} from "@/components/dashboard-components/project-details/custom-instructions-editor";
import {
  AvailableMcpServers,
  AvailableMcpServersProps,
} from "@/components/dashboard-components/project-details/available-mcp-servers";
import { AuthForm } from "@/components/auth/auth-form";
import { z } from "zod";

export const tamboRegisteredComponents = [
  {
    name: "ProjectTable",
    description:
      "Displays a comprehensive table of all user projects with project names, IDs (with copy functionality), creation dates, and navigation links to project details. Use when users want to view, browse, or select from their existing projects. Shows 'No projects found' message when empty and includes project count at the bottom.",
    component: ProjectTable,
    propsSchema: ProjectTableProps,
  },
  {
    name: "ProjectInfo",
    description:
      "Shows detailed information about a specific project including project name, unique ID (with copy button), owner details, and creation date. Features smooth animations and handles loading states. Use when displaying project overview information or when users need to reference project details like copying the project ID.",
    component: ProjectInfo,
    propsSchema: ProjectInfoProps,
  },
  {
    name: "APIKeyList",
    description:
      "Manages project API keys with full CRUD operations - create, view, and delete API keys. Automatically generates a first key for new projects. Shows masked key values, last usage dates, and provides secure key generation with one-time display. Includes animated interactions and handles loading states. Use when users need to manage authentication keys for their project.",
    component: APIKeyList,
    propsSchema: APIKeyListProps,
  },
  {
    name: "ProviderKeySection",
    description:
      "Comprehensive LLM provider configuration interface allowing users to select AI providers (OpenAI, Anthropic, etc.), configure models, set API keys, and manage custom endpoints. Handles free message limits, provider-specific settings, base URLs for custom providers, and validation. Shows real-time configuration status and supports both standard and OpenAI-compatible providers. Use when users need to configure or modify their AI model settings.",
    component: ProviderKeySection,
    propsSchema: ProviderKeySectionProps,
  },
  {
    name: "CustomInstructionsEditor",
    description:
      "Allows users to create and edit custom instructions that are automatically included in every AI conversation for their project. Features inline editing with save/cancel functionality, preview mode, and handles empty states. Use when users want to set project-wide AI behavior guidelines, context, or specific instructions that should apply to all interactions.",
    component: CustomInstructionsEditor,
    propsSchema: CustomInstructionsEditorProps,
  },
  {
    name: "AvailableMcpServers",
    description:
      "Manages Model Context Protocol (MCP) servers for extending AI capabilities with external tools and data sources. Allows adding, configuring, and removing MCP servers with authentication handling. Shows server status, transport methods, and provides integration management. Use when users need to connect external tools, APIs, or data sources to enhance their AI assistant's capabilities.",
    component: AvailableMcpServers,
    propsSchema: AvailableMcpServersProps,
  },
  {
    name: "AuthForm",
    description:
      "A form that allows users to authenticate with GitHub or Google. Use when users are not authenticated and need to log in to access features or when the fetchCurrentUser tool indicates the user is not logged in.",
    component: AuthForm,
    propsSchema: z.object({}),
  },
];

export const tamboRegisteredTools: TamboTool[] = [
  {
    name: "fetchCurrentUser",
    description:
      "Fetches the current user. If the user is not logged in, return a link that leads to the login page at /login",
    toolSchema: fetchCurrentUserSchema,
    tool: fetchCurrentUser,
  },
  {
    name: "fetchAllProjects",
    description: "Fetches all projects for the current user.",
    toolSchema: fetchAllProjectsSchema,
    tool: fetchAllProjects,
  },
  {
    name: "fetchProjectById",
    description: "Fetches a specific project by ID.",
    toolSchema: fetchProjectByIdSchema,
    tool: fetchProjectById,
  },
  {
    name: "updateProject",
    description: "Updates a project.",
    toolSchema: updateProjectSchema,
    tool: updateProject,
  },
  {
    name: "createProject",
    description: "Creates a new project.",
    toolSchema: createProjectSchema,
    tool: createProject,
  },
  {
    name: "removeProject",
    description: "Removes a project.",
    toolSchema: removeProjectSchema,
    tool: removeProject,
  },
  {
    name: "fetchProjectApiKeys",
    description: "Fetches API keys for a project.",
    toolSchema: fetchProjectApiKeysSchema,
    tool: fetchProjectApiKeys,
  },
  {
    name: "generateProjectApiKey",
    description: "Generates a new API key for a project.",
    toolSchema: generateProjectApiKeySchema,
    tool: generateProjectApiKey,
  },
  {
    name: "deleteProjectApiKey",
    description: "Deletes an API key for a project.",
    toolSchema: deleteProjectApiKeySchema,
    tool: deleteProjectApiKey,
  },
  {
    name: "fetchProjectLlmSettings",
    description: "Fetches LLM configuration settings for a project.",
    toolSchema: fetchProjectLlmSettingsSchema,
    tool: fetchProjectLlmSettings,
  },
  {
    name: "updateProjectLlmSettings",
    description:
      "Updates LLM configuration settings for a project. Always show ProviderKeySection component after calling this tool.",
    toolSchema: updateProjectLlmSettingsSchema,
    tool: updateProjectLlmSettings,
  },
  {
    name: "fetchProjectMcpServers",
    description: "Fetches MCP servers for a project.",
    toolSchema: fetchProjectMcpServersSchema,
    tool: fetchProjectMcpServers,
  },
  {
    name: "addMcpServer",
    description: "Adds a new MCP server to a project.",
    toolSchema: addMcpServerSchema,
    tool: addMcpServer,
  },
  {
    name: "updateMcpServer",
    description: "Updates an existing MCP server for a project.",
    toolSchema: updateMcpServerSchema,
    tool: updateMcpServer,
  },
  {
    name: "deleteMcpServer",
    description: "Deletes an MCP server for a project.",
    toolSchema: deleteMcpServerSchema,
    tool: deleteMcpServer,
  },
  {
    name: "authorizeMcpServer",
    description: "Authorizes an MCP server for a project.",
    toolSchema: authorizeMcpServerSchema,
    tool: authorizeMcpServer,
  },
  {
    name: "getMcpServerTools",
    description: "Gets the tools for an MCP server for a project.",
    toolSchema: getMcpServerToolsSchema,
    tool: getMcpServerTools,
  },
  // {
  //   name: "listAvailableApps",
  //   description: "Lists available apps for a project.",
  //   toolSchema: listAvailableAppsSchema,
  //   tool: listAvailableApps,
  // },
  // {
  //   name: "enableApp",
  //   description: "Enables an app for a project.",
  //   toolSchema: enableAppSchema,
  //   tool: enableApp,
  // },
  // {
  //   name: "disableApp",
  //   description: "Disables an app for a project.",
  //   toolSchema: disableAppSchema,
  //   tool: disableApp,
  // },
  // {
  //   name: "getComposioAuth",
  //   description: "Gets authentication details for a Composio tool.",
  //   toolSchema: getComposioAuthSchema,
  //   tool: getComposioAuth,
  // },
  // {
  //   name: "updateComposioAuth",
  //   description: "Updates authentication details for a Composio tool.",
  //   toolSchema: updateComposioAuthSchema,
  //   tool: updateComposioAuth,
  // },
  {
    name: "checkComposioConnectedAccountStatus",
    description: "Checks the status of a Composio connected account.",
    toolSchema: checkComposioConnectedAccountStatusSchema,
    tool: checkComposioConnectedAccountStatus,
  },
];
