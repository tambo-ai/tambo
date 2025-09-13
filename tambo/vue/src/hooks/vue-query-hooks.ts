import { useMutation, useQuery } from "@tanstack/vue-query";
import { useTamboQueryClient } from "../providers/tambo-client-provider";

export function useTamboQuery(options: any) {
  const queryClient = useTamboQueryClient();
  return useQuery(options as any, queryClient);
}

export function useTamboMutation(options: any) {
  const queryClient = useTamboQueryClient();
  return useMutation(options as any, queryClient);
}

export type UseTamboMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = any;

export type UseTamboQueryResult<TData = unknown, TError = Error> = any;

