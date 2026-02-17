/**
 * ThreadsClient - Thread and message management via SDK + query cache
 */

import type TamboAI from "@tambo-ai/typescript-sdk";
import type { Stream } from "@tambo-ai/typescript-sdk/core/streaming";
import type { QueryClient } from "@tanstack/query-core";
import { threadKeys } from "./query.js";
import type {
  MessageListResponse,
  RunCreateParams,
  RunCreateResponse,
  RunRunParams,
  RunRunResponse,
  ThreadCreateParams,
  ThreadCreateResponse,
  ThreadListParams,
  ThreadListResponse,
  ThreadRetrieveResponse,
} from "./types.js";

interface ClientDeps {
  readonly sdk: TamboAI;
  readonly queryClient: QueryClient;
  readonly userKey?: string;
}

export interface ThreadsClient {
  create(params: ThreadCreateParams): Promise<ThreadCreateResponse>;
  list(params?: ThreadListParams): Promise<ThreadListResponse>;
  get(threadId: string): Promise<ThreadRetrieveResponse>;
  delete(threadId: string): Promise<void>;
  listMessages(threadId: string): Promise<MessageListResponse>;
  /** Start a streaming run on an existing thread */
  run(threadId: string, params: RunRunParams): Promise<Stream<RunRunResponse>>;
  /** Create a new thread and start a streaming run */
  createRun(params: RunCreateParams): Promise<Stream<RunCreateResponse>>;
}

/**
 * Create a threads client for managing threads and messages
 *
 * @param deps - SDK and QueryClient dependencies
 * @returns ThreadsClient with CRUD and message operations
 */
export function createThreadsClient(deps: ClientDeps): ThreadsClient {
  const { sdk, queryClient, userKey } = deps;

  return {
    async create(params) {
      const result = await sdk.threads.create({
        ...params,
        ...(userKey ? { userKey } : {}),
      });
      await queryClient.invalidateQueries({
        queryKey: threadKeys.lists(),
      });
      return result;
    },

    async list(params) {
      return await queryClient.fetchQuery({
        queryKey: threadKeys.list(params ?? {}),
        queryFn: async () => await sdk.threads.list(params),
      });
    },

    async get(threadId) {
      return await queryClient.fetchQuery({
        queryKey: threadKeys.detail(threadId),
        queryFn: async () => await sdk.threads.retrieve(threadId),
      });
    },

    async delete(threadId) {
      await sdk.threads.delete(threadId);
      await queryClient.invalidateQueries({
        queryKey: threadKeys.lists(),
      });
      queryClient.removeQueries({
        queryKey: threadKeys.detail(threadId),
      });
    },

    async listMessages(threadId) {
      return await queryClient.fetchQuery({
        queryKey: threadKeys.messages(threadId),
        queryFn: async () => await sdk.threads.messages.list(threadId),
      });
    },

    async run(threadId, params) {
      const stream = await sdk.threads.runs.run(threadId, {
        ...params,
        ...(userKey ? { userKey } : {}),
      });
      await queryClient.invalidateQueries({
        queryKey: threadKeys.detail(threadId),
      });
      return stream;
    },

    async createRun(params) {
      const stream = await sdk.threads.runs.create({
        ...params,
        ...(userKey ? { userKey } : {}),
      });
      await queryClient.invalidateQueries({
        queryKey: threadKeys.lists(),
      });
      return stream;
    },
  };
}
