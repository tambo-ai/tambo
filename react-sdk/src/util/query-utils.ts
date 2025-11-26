import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

export type CombinedMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = Omit<
  UseMutationResult<TData, TError, TVariables, TContext>,
  "mutate" | "mutateAsync" | "reset" | "data" | "variables" | "context"
>;

/**
 * Combines two mutation results, showing the "loading state" of the two
 * mutations. For instance, if either mutation is pending, the combined
 * mutation result will be pending.
 * @param resultA - The first mutation result
 * @param resultB - The second mutation result
 * @returns The combined mutation result
 */
export function combineMutationResults<TData1, TData2, TError1, TError2>(
  resultA: UseMutationResult<TData1, TError1, any, any>,
  resultB: UseMutationResult<TData2, TError2, any, any>,
): CombinedMutationResult<TData1 | TData2, TError1 | TError2> {
  let status: "pending" | "error" | "success" | "idle";
  if (resultA.isPending || resultB.isPending) {
    status = "pending";
  } else if (resultA.isError || resultB.isError) {
    status = "error";
  } else if (resultA.isSuccess && resultB.isSuccess) {
    status = "success";
  } else {
    status = "idle";
  }

  return {
    isPending: resultA.isPending || resultB.isPending,
    isSuccess: resultA.isSuccess && resultB.isSuccess,
    isError: resultA.isError || resultB.isError,
    isIdle: resultA.isIdle && resultB.isIdle,
    isPaused: resultA.isPaused || resultB.isPaused,
    submittedAt: resultA.submittedAt || resultB.submittedAt,
    status,
    error: resultA.error ?? resultB.error,
    failureCount: resultA.failureCount + resultB.failureCount,
    failureReason: resultA.failureReason ?? resultB.failureReason,
  };
}

export type CombinedQueryResult<TData1, TData2, TError1, TError2> = Omit<
  UseQueryResult<TData1 | TData2, TError1 | TError2>,
  "data" | "refetch" | "promise"
>;
/**
 * Combines two query results, showing the "loading state" of the two queries.
 * For instance, if either query is loading, the combined query result will be
 * loading.
 * @param resultA - The first query result
 * @param resultB - The second query result
 * @returns The combined query result
 */
export function combineQueryResults<TData1, TData2, TError1, TError2>(
  resultA: UseQueryResult<TData1, TError1>,
  resultB: UseQueryResult<TData2, TError2>,
): CombinedQueryResult<void, void, TError1, TError2> {
  let status: "pending" | "error" | "success";
  if (resultA.isPending || resultB.isPending) {
    status = "pending";
  } else if (resultA.isError || resultB.isError) {
    status = "error";
  } else if (resultA.isSuccess && resultB.isSuccess) {
    status = "success";
  } else {
    status = "pending";
  }

  let fetchStatus: "fetching" | "paused" | "idle";
  if (resultA.isFetching || resultB.isFetching) {
    fetchStatus = "fetching";
  } else if (resultA.isPaused || resultB.isPaused) {
    fetchStatus = "paused";
  } else {
    fetchStatus = "idle";
  }

  return {
    isPending: resultA.isPending || resultB.isPending,
    isSuccess: resultA.isSuccess && resultB.isSuccess,
    isError: resultA.isError || resultB.isError,
    isEnabled: resultA.isEnabled && resultB.isEnabled,
    isLoading: resultA.isLoading || resultB.isLoading,
    isFetched: resultA.isFetched && resultB.isFetched,
    isFetchedAfterMount:
      resultA.isFetchedAfterMount && resultB.isFetchedAfterMount,
    isInitialLoading: resultA.isInitialLoading || resultB.isInitialLoading,
    isPaused: resultA.isPaused || resultB.isPaused,
    isLoadingError: resultA.isLoadingError || resultB.isLoadingError,
    isRefetchError: resultA.isRefetchError || resultB.isRefetchError,
    isPlaceholderData: resultA.isPlaceholderData || resultB.isPlaceholderData,
    isStale: resultA.isStale || resultB.isStale,
    isRefetching: resultA.isRefetching || resultB.isRefetching,
    isFetching: resultA.isFetching || resultB.isFetching,
    status,
    error: resultA.error ?? resultB.error,
    failureCount: resultA.failureCount + resultB.failureCount,
    failureReason: resultA.failureReason ?? resultB.failureReason,
    errorUpdateCount: resultA.errorUpdateCount + resultB.errorUpdateCount,
    fetchStatus,
    dataUpdatedAt: Math.max(resultA.dataUpdatedAt, resultB.dataUpdatedAt),
    errorUpdatedAt: Math.max(resultA.errorUpdatedAt, resultB.errorUpdatedAt),
  };
}
