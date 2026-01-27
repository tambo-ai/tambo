"use client";

/**
 * Thread List Query Hook for v1 API
 *
 * React Query hook for fetching a list of threads.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ThreadListResponse } from "@tambo-ai/typescript-sdk/resources/threads/threads";
import { useTamboClient } from "../../providers/tambo-client-provider";

/**
 * Options for fetching thread list
 */
export interface ThreadListOptions {
  /**
   * Optional context key to filter threads by
   */
  contextKey?: string;

  /**
   * Maximum number of threads to return (as string per SDK)
   */
  limit?: string;

  /**
   * Pagination cursor for fetching next page
   */
  cursor?: string;
}

/**
 * Hook to fetch a list of threads.
 *
 * Uses React Query for caching and automatic refetching.
 * Threads are considered stale after 5 seconds.
 *
 * Returns the thread list directly from the SDK with no transformation.
 * Each thread includes runStatus, metadata, and all SDK fields.
 * @param listOptions - Filtering and pagination options
 * @param queryOptions - Additional React Query options
 * @returns React Query query object with thread list
 * @example
 * ```tsx
 * function ThreadList({ contextKey }: { contextKey?: string }) {
 *   const { data, isLoading, isError } = useTamboV1ThreadList({
 *     contextKey,
 *     limit: "20",
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <Error />;
 *
 *   return (
 *     <ul>
 *       {data.threads.map(thread => (
 *         <li key={thread.id}>
 *           {thread.id} - {thread.runStatus}
 *         </li>
 *       ))}
 *       {data.hasMore && <LoadMoreButton cursor={data.nextCursor} />}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTamboV1ThreadList(
  listOptions?: ThreadListOptions,
  queryOptions?: Omit<
    UseQueryOptions<ThreadListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useTamboClient();

  return useQuery({
    queryKey: ["v1-threads", "list", listOptions],
    queryFn: async () => await client.threads.list(listOptions),
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
  });
}
