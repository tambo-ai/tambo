import type TamboAI from "@tambo-ai/typescript-sdk";
import { UseQueryOptions } from "@tanstack/react-query";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboQuery } from "./react-query-hooks";

interface UseTamboThreadListConfig {
  /**
   * The projectId to get the threads for. If not provided, the current project
   * will be used.
   */
  projectId?: string;
  /**
   * The context key to get the threads for. If not provided, all threads for
   * the project will be returned.
   */
  contextKey?: string;
}

interface UseTamboThreadListConfig {
  /**
   * The projectId to get the threads for. If not provided, the current project
   * will be used.
   */
  projectId?: string;
  /**
   * The context key to get the threads for. If not provided, all threads for
   * the project will be returned.
   */
  contextKey?: string;
}

/**
 * Get all the threads for the specified project.
 *
 * If contextKey is empty, then all threads for the project will be returned.
 * If contextKey is not empty, then only the threads for the specified context
 * key will be returned.
 * @param config - The config for the useTamboThreadList hook
 * @param config.projectId - The projectId to get the threads for
 * @param config.contextKey - The context key to get the threads for
 * @returns The threads for the specified project and optional context key
 */
export function useTamboThreadList(
  { projectId, contextKey }: UseTamboThreadListConfig = {},
  options: Partial<
    UseQueryOptions<TamboAI.Beta.Threads.ThreadsOffsetAndLimit | null>
  > = {},
) {
  const client = useTamboClient();
  const { data: queriedProjectId, ...projectIdState } = useTamboQuery({
    ...(options as unknown as UseQueryOptions<string>),
    queryKey: ["projectId"],
    queryFn: async () => {
      return (await client.beta.projects.getCurrent()).id;
    },
  });
  const currentProjectId = projectId ?? queriedProjectId;

  const threadState = useTamboQuery({
    ...options,
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
