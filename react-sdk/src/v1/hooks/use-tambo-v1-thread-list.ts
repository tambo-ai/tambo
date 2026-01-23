"use client";

/**
 * Thread List Query Hook for v1 API
 *
 * React Query hook for fetching a list of threads.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useTamboClient } from "../../providers/tambo-client-provider";
import type { TamboV1Thread } from "../types/thread";

/**
 * Options for fetching thread list
 */
export interface ThreadListOptions {
  /**
   * Project ID to filter threads by
   */
  projectId?: string;

  /**
   * Maximum number of threads to return
   */
  limit?: number;

  /**
   * Pagination cursor for fetching next page
   */
  after?: string;
}

/**
 * Response from thread list query
 */
export interface ThreadListResponse {
  /**
   * Array of threads
   */
  data: TamboV1Thread[];

  /**
   * Whether there are more threads available
   */
  hasMore: boolean;

  /**
   * Cursor for fetching next page
   */
  nextCursor?: string;
}

/**
 * Hook to fetch a list of threads.
 *
 * Uses React Query for caching and automatic refetching.
 * Threads are considered stale after 5 seconds.
 * @param listOptions - Filtering and pagination options
 * @param queryOptions - Additional React Query options
 * @returns React Query query object with thread list
 * @example
 * ```tsx
 * function ThreadList({ projectId }: { projectId: string }) {
 *   const { data, isLoading, isError } = useTamboV1ThreadList({
 *     projectId,
 *     limit: 20,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <Error />;
 *
 *   return (
 *     <ul>
 *       {data.data.map(thread => (
 *         <li key={thread.id}>{thread.title}</li>
 *       ))}
 *       {data.hasMore && <LoadMoreButton />}
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
    queryFn: async () => {
      const response = await client.threads.list({
        limit: listOptions?.limit?.toString(), // SDK expects string
        cursor: listOptions?.after,
      });

      // Transform SDK response to ThreadListResponse
      return {
        data: response.threads.map(
          (thread) =>
            ({
              id: thread.id,
              projectId: thread.projectId,
              messages: [], // Messages not included in list response
              status: "idle" as const,
              metadata: thread.metadata,
              createdAt: thread.createdAt,
              updatedAt: thread.updatedAt,
            }) as TamboV1Thread,
        ),
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      };
    },
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
  });
}
