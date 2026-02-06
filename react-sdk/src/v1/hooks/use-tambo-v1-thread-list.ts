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
import { useTamboQuery } from "../../hooks/react-query-hooks";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboV1Config } from "../providers/tambo-v1-provider";

/**
* Options for fetching thread list.
* Extended from the SDK for convenience.
* Note: userKey can also be provided via TamboV1Provider context.
*/
export type ThreadListOptions = Omit<ThreadListParams, "limit"> & {
  /**
   * Maximum number of threads to return.
   *
   * Accepts a number or a numeric string. Invalid values cause the query to
   * error.
   */
  limit?: number | string;
};

function normalizeThreadListOptions(
  listOptions: ThreadListOptions | undefined,
): {
  params: ThreadListParams | undefined;
  queryKeyOptions: ThreadListOptions | undefined;
  invalidLimit: ThreadListOptions["limit"] | undefined;
} {
  if (!listOptions) {
    return {
      params: undefined,
      queryKeyOptions: undefined,
      invalidLimit: undefined,
    };
  }

  const { limit, ...rest } = listOptions;
  if (limit === undefined) {
    return { params: rest, queryKeyOptions: rest, invalidLimit: undefined };
  }

  const limitNumber = typeof limit === "string" ? Number(limit) : limit;
  if (!Number.isFinite(limitNumber)) {
    return { params: rest, queryKeyOptions: listOptions, invalidLimit: limit };
  }

  const normalized = { ...rest, limit: limitNumber };
  return {
    params: normalized,
    queryKeyOptions: normalized,
    invalidLimit: undefined,
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

  const normalized = normalizeThreadListOptions(effectiveOptions);

  return useTamboQuery({
    queryKey: ["v1-threads", "list", normalized.queryKeyOptions],
    queryFn: async () => {
      if (normalized.invalidLimit !== undefined) {
        throw new Error(`Invalid thread list limit: ${normalized.invalidLimit}`);
      }

      return await client.threads.list(normalized.params);
    },
    staleTime: 5000, // Consider stale after 5s
    ...queryOptions,
  });
}
