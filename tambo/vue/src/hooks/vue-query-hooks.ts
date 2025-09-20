import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryReturnType,
  type UseMutationOptions,
  type UseMutationReturnType,
} from "@tanstack/vue-query";
import { useTamboQueryClient } from "../providers/tambo-client-provider";

export function useTamboQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryReturnType<TData, TError> {
  const queryClient = useTamboQueryClient();
  return useQuery(options as any, queryClient);
}

export function useTamboMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>): UseMutationReturnType<TData, TError, TVariables, TContext> {
  const queryClient = useTamboQueryClient();
  return useMutation(options as any, queryClient);
}

export type UseTamboMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = UseMutationReturnType<TData, TError, TVariables, TContext>;

export type UseTamboQueryResult<TData = unknown, TError = Error> = UseQueryReturnType<TData, TError>;

