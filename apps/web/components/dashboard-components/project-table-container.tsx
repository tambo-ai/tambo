"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { z } from "zod/v3";
import { ProjectTable } from "./project-table";

/**
 * Self-contained wrapper for ProjectTable that handles TRPC data fetching and state management.
 *
 * This component fetches projects directly and renders them in a native table.
 * tambo doesn't need to fetch data first - it just calls this component with minimal props.
 *
 */

interface ProjectTableContainerProps {
  compact?: boolean;
}

export const ProjectTableContainerSchema = z.object({
  compact: z
    .boolean()
    .optional()
    .describe(
      "Whether to show the table in compact mode. Always use compact=true. When true, hides checkbox, users, and actions columns for a cleaner view. Defaults to false.",
    ),
});

export function ProjectTableContainer({
  compact = true,
}: ProjectTableContainerProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );

  // Fetch projects with default sorting by most recent thread update
  const { data: projects } = api.project.getUserProjects.useQuery(undefined, {
    // The query is always enabled since we're fetching for the current user
  });

  return (
    <ProjectTable
      projects={projects}
      compact={compact}
      selectedProjects={selectedProjects}
      onSelectedProjectsChange={setSelectedProjects}
    />
  );
}
