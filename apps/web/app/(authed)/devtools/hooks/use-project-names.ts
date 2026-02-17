"use client";

import { useMemo } from "react";

import { api } from "@/trpc/react";

/**
 * Resolves project UUIDs to human-readable project names by fetching the
 * current user's project list and building a lookup map.
 *
 * @returns A map of project ID to project name.
 */
export function useProjectNames(
  projectIds: (string | undefined)[],
): Map<string, string> {
  const uniqueIds = useMemo(
    () => [...new Set(projectIds.filter(Boolean) as string[])],
    [projectIds],
  );

  const { data: projects } = api.project.getUserProjects.useQuery(undefined, {
    enabled: uniqueIds.length > 0,
  });

  return useMemo(() => {
    const map = new Map<string, string>();
    if (!projects) return map;
    for (const project of projects) {
      if (uniqueIds.includes(project.id)) {
        map.set(project.id, project.name);
      }
    }
    return map;
  }, [projects, uniqueIds]);
}
