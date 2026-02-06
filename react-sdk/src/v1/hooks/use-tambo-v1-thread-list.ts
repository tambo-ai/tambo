"use client";

/**
 * Thread List Query Hook for v1 API
 *
 * React Query hook for fetching a list of threads.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  ThreadListParams,
  ThreadListResponse,
} from "@tambo-ai/typescript-sdk/resources/threads/threads";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboV1Config } from "../providers/tambo-v1-provider";

/**
 * Options for fetching thread list
 */
export interface ThreadListOptions {
  /**
   * User key to scope thread list.
   * Only threads owned by this userKey will be returned.
   * If not provided here, uses the userKey from TamboV1Provider context.
   */
  userKey?: string;

  /**
   * Maximum number of threads to return
   */
  limit?: number | string;

  /**
   * Pagination cursor for fetching next page
   */
  cursor?: string;
}

function normalizeThreadListOptions(
  listOptions: ThreadListOptions | undefined,
): ThreadListParams | undefined {
  if (!listOptions) return undefined;

  const rawLimit = listOptions.limit;
  const userKey = listOptions.userKey;
  const cursor = listOptions.cursor;

  const limit = (() => {
    if (rawLimit === undefined) return undefined;

    if (typeof rawLimit === "number") {
      return Number.isFinite(rawLimit) ? rawLimit : undefined;
    }

    const trimmedRawLimit = rawLimit.trim();
    if (trimmedRawLimit === "") return undefined;

    const parsedLimit = Number(trimmedRawLimit);
    return Number.isFinite(parsedLimit) ? parsedLimit : undefined;
  })();

  if (userKey === undefined && cursor === undefined && limit === undefined) {
    return undefined;
  }

  return {
    ...(userKey === undefined ? {} : { userKey }),
    ...(cursor === undefined ? {} : { cursor }),
    ...(limit === undefined ? {} : { limit }),
  };
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
  listOptions?: ThreadListOptions,
  queryOptions?: Omit<
    UseQueryOptions<ThreadListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useTamboClient();
  const { userKey: contextUserKey } = useTamboV1Config();

  // Merge userKey from context with provided options (explicit option takes precedence)
  const effectiveOptions: ThreadListOptions | undefined =
    (listOptions?.userKey ?? contextUserKey)
      ? { ...listOptions, userKey: listOptions?.userKey ?? contextUserKey }
      : listOptions;

  const params = normalizeThreadListOptions(effectiveOptions);

  return useQuery({
    queryKey: ["v1-threads", "list", params],
    queryFn: async () => await client.threads.list(params),
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
  });
}
