"use client";

/**
 * Thread Query Hook for v1 API
 *
 * React Query hook for fetching a single thread.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useTamboClient } from "../../providers/tambo-client-provider";
import type { TamboV1Thread } from "../types/thread";

/**
 * Hook to fetch a single thread by ID.
 *
 * Uses React Query for caching and automatic refetching.
 * Thread data is considered stale after 1 second (real-time data).
 * @param threadId - Thread ID to fetch
 * @param options - Additional React Query options
 * @returns React Query query object with thread data
 * @example
 * ```tsx
 * function ThreadView({ threadId }: { threadId: string }) {
 *   const { data: thread, isLoading, isError } = useTamboV1Thread(threadId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <Error />;
 *
 *   return (
 *     <div>
 *       <h1>{thread.title}</h1>
 *       {thread.messages.map(msg => <Message key={msg.id} message={msg} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1Thread(
  threadId: string,
  options?: Omit<UseQueryOptions<TamboV1Thread>, "queryKey" | "queryFn">,
) {
  const client = useTamboClient();

  return useQuery({
    queryKey: ["v1-threads", threadId],
    queryFn: async () => {
      const response = await client.threads.retrieve(threadId);
      // Transform SDK response to TamboV1Thread
      return {
        id: response.id,
        projectId: response.projectId,
        messages: [], // Messages fetched separately via streaming
        status: "idle" as const,
        metadata: response.metadata,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      } as TamboV1Thread;
    },
    staleTime: 1000, // Consider stale after 1s (real-time data)
    ...options,
  });
}
