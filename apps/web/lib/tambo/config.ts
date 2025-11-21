"use client";

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
];
