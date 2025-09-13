import {
  type UseMutationOptions,
  type UseMutationReturnType,
  type UseQueryOptions,
  type UseQueryReturnType,
  useMutation,
  useQuery,
} from "@tanstack/vue-query";
import { useTamboQueryClient } from "../providers/tambo-client-provider";

export function useTamboQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends readonly unknown[] = readonly unknown[]>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const queryClient = useTamboQueryClient();
  return useQuery(options, queryClient) as UseQueryReturnType<TData, TError>;
}

export function useTamboMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const queryClient = useTamboQueryClient();
  return useMutation(options, queryClient) as UseMutationReturnType<TData, TError, TVariables, TContext>;
}

export type UseTamboMutationResult<TData = unknown, TError = Error, TVariables = void, TContext = unknown> = UseMutationReturnType<TData, TError, TVariables, TContext>;
export type UseTamboQueryResult<TData = unknown, TError = Error> = UseQueryReturnType<TData, TError>;

