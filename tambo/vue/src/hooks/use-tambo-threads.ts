import type TamboAI from "@tambo-ai/typescript-sdk";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboQuery } from "./vue-query-hooks";
import { computed } from "vue";

interface UseTamboThreadListConfig {
  projectId?: string;
  contextKey?: string;
}

export function useTamboThreadList(
  { projectId, contextKey }: UseTamboThreadListConfig = {},
  options: Partial<any> = {},
) {
  const client = useTamboClient();
  const { data: queriedProjectId, ...projectIdState } = useTamboQuery({
    ...(options as any),
    queryKey: ["projectId"],
    queryFn: async () => {
      return (await client.beta.projects.getCurrent()).id;
    },
  });
  const currentProjectId = projectId ?? (queriedProjectId as unknown as string | undefined);

  const threadState = useTamboQuery({
    ...options,
    enabled: computed(() => !!currentProjectId) as any,
    queryKey: computed(() => ["threads", currentProjectId, contextKey]) as any,
    queryFn: async () => {
      if (!currentProjectId) return null as TamboAI.Beta.Threads.ThreadsOffsetAndLimit | null;
      const threadIter = await client.beta.threads.list(currentProjectId, { contextKey });
      return threadIter as any;
    },
  });

  return currentProjectId ? threadState : { data: null, ...projectIdState };
}

