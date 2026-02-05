"use client";

/**
 * Thread List Query Hook for v1 API
 *
 * React Query hook for fetching a list of threads.
 */

import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  ThreadListParams,
  ThreadListResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboQuery } from "../../hooks/react-query-hooks";
import { useTamboV1Config } from "../providers/tambo-v1-provider";

/**
 * Options for fetching thread list.
 * Re-exported from SDK for convenience.
 * Note: userKey can also be provided via TamboV1Provider context.
 */
export type { ThreadListParams as ThreadListOptions };

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
 * function ThreadList({ userKey }: { userKey?: string }) {
 *   const { data, isLoading, isError } = useTamboV1ThreadList({
 *     userKey,
 *     limit: 20,
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
  listOptions?: ThreadListParams,
  queryOptions?: Omit<
    UseQueryOptions<ThreadListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useTamboClient();
  const { userKey: contextUserKey } = useTamboV1Config();

  // Merge userKey from context with provided options (explicit option takes precedence)
  const effectiveOptions: ThreadListParams | undefined =
    (listOptions?.userKey ?? contextUserKey)
      ? { ...listOptions, userKey: listOptions?.userKey ?? contextUserKey }
      : listOptions;

  return useTamboQuery({
    queryKey: ["v1-threads", "list", effectiveOptions],
    queryFn: async () => await client.threads.list(effectiveOptions),
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
  });
}
