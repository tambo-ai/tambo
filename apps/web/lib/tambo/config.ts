"use client";

import {
  CustomInstructionsEditor,
  InteractableCustomInstructionsEditorProps,
} from "@/components/dashboard-components/project-details/custom-instructions-editor";
import {
  ProviderKeySectionBase,
  InteractableProviderKeySectionProps,
} from "@/components/dashboard-components/project-details/provider-key-section";
import {
  ToolCallLimitEditor,
  InteractableToolCallLimitEditorProps,
} from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import {
  AvailableMcpServers,
  InteractableAvailableMcpServersProps,
} from "@/components/dashboard-components/project-details/available-mcp-servers";
import {
  OAuthSettings,
  InteractableOAuthSettingsProps,
} from "@/components/dashboard-components/project-details/oauth-settings";
import {
  APIKeyList,
  InteractableAPIKeyListProps,
} from "@/components/dashboard-components/project-details/api-key-list";
import {
  DailyMessagesChart,
  DailyMessagesChartSchema,
} from "@/components/dashboard-components/project-details/daily-messages-chart";
import {
  ProjectInfo,
  ProjectInfoProps,
} from "@/components/dashboard-components/project-details/project-info";
import {
  ProjectTableContainer,
  ProjectTableContainerSchema,
} from "@/components/dashboard-components/project-table-container";
import {
  ThreadTableContainer,
  ThreadTableContainerSchema,
} from "@/components/observability/thread-table/thread-table-container";

export const tamboRegisteredComponents = [
  {
    name: "ProjectTable",
    description:
      "Displays a comprehensive table of all user projects. This component automatically fetches project data and renders a native table with project names, IDs (with copy functionality), creation dates, last message times, message counts, and navigation links. Use when users want to view, browse, or list their projects. Shows 'No projects found' message when empty. IMPORTANT: This component fetches its own data - do NOT call fetchAllProjects first. Simply call this component directly.",
    component: ProjectTableContainer,
    propsSchema: ProjectTableContainerSchema,
  },
  {
    name: "ProjectInfo",
    description:
      "Shows detailed information about a specific project including project name, unique ID (with copy button), owner details, and creation date. Features smooth animations and handles loading states. Use when displaying project overview information or when users need to reference project details like copying the project ID.",
    component: ProjectInfo,
    propsSchema: ProjectInfoProps,
  },
  {
    name: "DailyMessagesChart",
    description:
      "Displays a bar chart showing daily message activity for one or more projects over a configurable time period (1-90 days, default 30). Accepts either a single project ID or an array of project IDs to show combined activity across multiple projects. Features responsive design with smooth animations, loading states, and empty state handling. Shows date-formatted labels and message counts with visual indicators. Use when users want to view message activity trends and usage patterns for their project analytics or across all their projects.",
    component: DailyMessagesChart,
    propsSchema: DailyMessagesChartSchema,
  },
  {
    name: "ThreadTable",
    description:
      "Displays a comprehensive table of all threads for a specific project with full functionality including search, sorting, deletion, and message viewing. Features responsive design with smooth animations, loading states, and empty state handling. Shows thread ID, creation date, message count, tools, components, and errors. Supports compact mode which hides Updated, Context Key, and Thread Name columns for a cleaner view. IMPORTANT: This component requires a valid project ID (not project name). Always set compact=true for a cleaner interface. Use when users want to view and manage all threads for a specific project.",
    component: ThreadTableContainer,
    propsSchema: ThreadTableContainerSchema,
  },
  {
    name: "CustomInstructionsEditor",
    description:
      "A component that allows users to edit custom instructions for their AI assistant project. Users can toggle edit mode, update the custom instructions text, and control whether system prompts can override these instructions.",
    component: CustomInstructionsEditor,
    propsSchema: InteractableCustomInstructionsEditorProps,
  },
  {
    name: "ProviderKeySection",
    description:
      "Manages LLM and Agent provider configuration for a project. Allows switching between LLM mode (traditional language models) and Agent mode (custom agent endpoints). In LLM mode, users can select providers (OpenAI, Anthropic, OpenAI-compatible, etc.), choose models, configure API keys, set custom model names and base URLs for compatible providers, and adjust input token limits. In Agent mode, users can configure custom agent URLs and metadata. This component validates API keys, handles free message limits for OpenAI's default model, and saves all configuration changes to the project.",
    component: ProviderKeySectionBase,
    propsSchema: InteractableProviderKeySectionProps,
  },
  {
    name: "ToolCallLimitEditor",
    description:
      "Manages the maximum number of tool calls allowed per response for a project. This helps prevent infinite loops and controls resource usage. Users can view the current limit and edit it to a new value.",
    component: ToolCallLimitEditor,
    propsSchema: InteractableToolCallLimitEditorProps,
  },
  {
    name: "AvailableMcpServers",
    description:
      "Manages and displays MCP (Model Context Protocol) servers for a project. Shows a list of configured MCP servers with options to add new servers, edit existing ones, or delete them. Each server can be configured with a URL and custom headers.",
    component: AvailableMcpServers,
    propsSchema: InteractableAvailableMcpServersProps,
  },
  {
    name: "OAuthSettings",
    description:
      "Manages OAuth token validation settings for a project. Configure how OAuth bearer tokens are validated, including validation mode (None, Symmetric, Asymmetric Auto, Asymmetric Manual), token required setting, secret keys, and public keys. Users can view current settings and update them.",
    component: OAuthSettings,
    propsSchema: InteractableOAuthSettingsProps,
  },
  {
    name: "APIKeyList",
    description:
      "A component that allows users to manage API keys for their project. Users can view existing API keys, create new keys with custom names, and delete keys they no longer need. Each key is displayed with its creation date and preview, and newly created keys are shown once for copying.",
    component: APIKeyList,
    propsSchema: InteractableAPIKeyListProps,
  },
];
