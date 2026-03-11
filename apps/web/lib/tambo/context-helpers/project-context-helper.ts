import type { useTRPCClient } from "@/trpc/react";

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
 * Creates a context helper that provides the user's projects and
 * identifies which project they're currently viewing based on the URL.
 *
 * @param trpcClient - The tRPC client for fetching project data
 * @returns An async context helper function
 */
export function createProjectContextHelper(
  trpcClient: ReturnType<typeof useTRPCClient>,
) {
  return async (): Promise<ProjectContextData | null> => {
    try {
      const projects = await trpcClient.project.getUserProjects.query();

      const currentProjectId = extractProjectIdFromUrl();
      const currentProject = currentProjectId
        ? projects.find((p) => p.id === currentProjectId)
        : null;

      return {
        currentProjectId,
        currentProjectName: currentProject?.name ?? null,
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
      };
    } catch {
      // User might not be logged in — that's fine, skip the context
      return null;
    }
  };
}
