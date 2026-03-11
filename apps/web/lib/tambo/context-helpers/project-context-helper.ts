"use client";

import { api } from "@/trpc/react";
import { useTamboContextHelpers } from "@tambo-ai/react";
import { useCallback, useEffect } from "react";

/**
 * Extracts the project ID from the current URL pathname.
 * Dashboard routes follow the pattern `/{projectId}/...`.
 * @returns The project ID if found, or null
 */
function extractProjectIdFromUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const pathname = window.location.pathname;
  // Project IDs look like "p_xxxxx.xxxxx" — the first path segment after "/"
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && firstSegment.startsWith("p_")) {
    return firstSegment;
  }

  return null;
}

interface ProjectSummary {
  id: string;
  name: string;
}

interface ProjectContextData {
  currentProjectId: string | null;
  currentProjectName: string | null;
  projects: ProjectSummary[];
}

/**
 * Hook that registers a context helper providing the user's projects
 * and which project they're currently viewing based on the URL.
 * Uses React Query for data fetching so it stays within React lifecycles.
 */
export function useProjectContextHelper() {
  const { data: projects } = api.project.getUserProjects.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { addContextHelper } = useTamboContextHelpers();

  const projectContextHelper = useCallback((): ProjectContextData | null => {
    if (!projects) {
      return null;
    }

    const currentProjectId = extractProjectIdFromUrl();
    const currentProject = currentProjectId
      ? projects.find((p) => p.id === currentProjectId)
      : null;

    return {
      currentProjectId,
      currentProjectName: currentProject?.name ?? null,
      projects: projects.map(
        (p): ProjectSummary => ({ id: p.id, name: p.name }),
      ),
    };
  }, [projects]);

  useEffect(() => {
    addContextHelper("userProjects", projectContextHelper);
  }, [addContextHelper, projectContextHelper]);
}
