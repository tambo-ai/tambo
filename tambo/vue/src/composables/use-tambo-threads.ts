import type TamboAI from "@tambo-ai/typescript-sdk";
import { type UseQueryOptions } from "@tanstack/vue-query";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboQuery } from "./vue-query-hooks";

interface UseTamboThreadListConfig {
  projectId?: string;
  contextKey?: string;
}

export function useTamboThreadList(
  { projectId, contextKey }: UseTamboThreadListConfig = {},
  options: Partial<UseQueryOptions<TamboAI.Beta.Threads.ThreadsOffsetAndLimit | null>> = {},
) {
  const client = useTamboClient();
  const { data: queriedProjectId, ...projectIdState } = useTamboQuery<string>({
    ...(options as any),
    queryKey: ["projectId"],
    queryFn: async () => {
      return ((await (client as any).beta.projects.getCurrent()).id) as string;
    },
  } as any);
  const currentProjectId = projectId ?? (queriedProjectId as any);
  const threadState = useTamboQuery<TamboAI.Beta.Threads.ThreadsOffsetAndLimit | null>({
    ...(options as any),
    enabled: !!currentProjectId as any,
    queryKey: ["threads", currentProjectId, contextKey] as any,
    queryFn: async () => {
      if (!currentProjectId) return null as any;
      const threadIter = await (client as any).beta.threads.list(currentProjectId as any, { contextKey });
      return threadIter as any;
    },
  } as any);
  return currentProjectId ? (threadState as any) : ({ data: null, ...projectIdState } as any);
}

