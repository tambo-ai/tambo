"use client";

/**
 * Thread Query Hook for v1 API
 *
 * React Query hook for fetching a single thread.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ThreadRetrieveResponse } from "@tambo-ai/typescript-sdk/resources/threads/threads";
import { useTamboClient } from "../../providers/tambo-client-provider";

/**
 * Hook to fetch a single thread by ID.
 *
 * Uses React Query for caching and automatic refetching.
 * Thread data is considered stale after 1 second (real-time data).
 *
 * Returns the thread with all its messages and current run status directly
 * from the SDK with no transformation.
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
 *       <div>Status: {thread.runStatus}</div>
 *       {thread.messages.map(msg => <Message key={msg.id} message={msg} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1Thread(
  threadId: string,
  options?: Omit<
    UseQueryOptions<ThreadRetrieveResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useTamboClient();

  return useQuery({
    queryKey: ["v1-threads", threadId],
    queryFn: async () => await client.threads.retrieve(threadId),
    staleTime: 1000, // Consider stale after 1s (real-time data)
    ...options,
  });
}
