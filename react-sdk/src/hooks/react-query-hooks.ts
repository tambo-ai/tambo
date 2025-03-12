// tamboHooks.ts
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useTamboQueryClient } from "../providers/tambo-client-provider";

/**
 * Wrapper around useQuery that uses the internal tambo query client.
 *
 * Use this instead of useQuery from @tanstack/react-query
 */
export function useTamboQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = useTamboQueryClient();
  return useQuery(options, queryClient);
}

/**
 * Wrapper around useMutation that uses the internal tambo query client.
 *
 * Use this instead of useMutation from @tanstack/react-query
 */
export function useTamboMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useTamboQueryClient();
  return useMutation(options, queryClient);
}

/**
 * Type alias for the result of a mutation.
 */
export type UseTamboMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = UseMutationResult<TData, TError, TVariables, TContext>;

/**
 * Hook for creating a mutation with the tambo query client.
 */
export function useTamboMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  return useTamboMutation<TData, TError, TVariables, TContext>(options);
}
