import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboQuery } from "./react-query-hooks";

/**
 * Get the threads for the specified project and optional context key.
 */
export function useTamboThreadList({
  projectId,
  contextKey,
}: {
  projectId?: string;
  contextKey?: string;
} = {}) {
  const client = useTamboClient();
  const { data: queriedProjectId, ...projectIdState } = useTamboQuery({
    queryKey: ["projectId"],
    queryFn: async () => {
      return (await client.beta.projects.getCurrent()).id;
    },
  });
  const currentProjectId = projectId ?? queriedProjectId;

  const threadState = useTamboQuery({
    enabled: !!currentProjectId,
    queryKey: ["threads", currentProjectId, contextKey],
    queryFn: async () => {
      if (!currentProjectId) {
        return null;
      }
      const threadIter = await client.beta.threads.list(currentProjectId, {
        contextKey,
      });
      return threadIter;
    },
  });

  return currentProjectId ? threadState : { data: null, ...projectIdState };
}
