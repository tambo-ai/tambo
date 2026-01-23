"use client";

/**
 * Send Message Hook for v1 API
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { EventType, type RunStartedEvent } from "@ag-ui/core";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import { useStreamDispatch } from "../providers/tambo-v1-stream-context";
import type { InputMessage } from "../types/message";
import {
  toAvailableComponents,
  toAvailableTools,
} from "../utils/registry-conversion";
import { handleEventStream } from "../utils/stream-handler";

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  /**
   * The message to send
   */
  message: InputMessage;

  /**
   * Enable debug logging for the stream
   */
  debug?: boolean;
}

/**
 * Hook to send a message and handle streaming responses.
 *
 * This hook handles two scenarios:
 * - If threadId provided: runs on existing thread via client.threads.runs.run()
 * - If no threadId: creates new thread via client.threads.runs.create()
 *
 * The hook:
 * - Sends a user message to the API
 * - Streams AG-UI events in real-time
 * - Dispatches events to the stream reducer
 * - Extracts threadId from events when creating new thread
 * - Handles tool execution (Phase 6)
 * - Invalidates thread queries on completion
 * @param threadId - Optional thread ID to send message to. If not provided, creates new thread
 * @returns React Query mutation object with threadId in mutation result
 * @example
 * ```tsx
 * // Send message on existing thread
 * function ChatInput({ threadId }: { threadId: string }) {
 *   const sendMessage = useTamboV1SendMessage(threadId);
 *
 *   const handleSubmit = (text: string) => {
 *     sendMessage.mutate({
 *       message: {
 *         role: "user",
 *         content: [{ type: "text", text }],
 *       },
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input onSubmit={handleSubmit} />
 *       {sendMessage.isPending && <Spinner />}
 *     </div>
 *   );
 * }
 *
 * // Create new thread
 * function NewChat() {
 *   const sendMessage = useTamboV1SendMessage();
 *
 *   const handleSubmit = async (text: string) => {
 *     const result = await sendMessage.mutateAsync({
 *       message: {
 *         role: "user",
 *         content: [{ type: "text", text }],
 *       },
 *     });
 *     console.log("Created thread:", result.threadId);
 *   };
 *
 *   return <input onSubmit={handleSubmit} />;
 * }
 * ```
 */
export function useTamboV1SendMessage(threadId?: string) {
  const client = useTamboClient();
  const dispatch = useStreamDispatch();
  const registry = useContext(TamboRegistryContext);
  const queryClient = useQueryClient();

  if (!registry) {
    throw new Error(
      "useTamboV1SendMessage must be used within TamboRegistryProvider",
    );
  }

  return useMutation({
    mutationFn: async (options: SendMessageOptions) => {
      const { message, debug = false } = options;

      // Convert registry components/tools to v1 API format
      const availableComponents = toAvailableComponents(registry.componentList);
      const availableTools = toAvailableTools(registry.toolRegistry);

      // Determine which API to call based on threadId presence
      let stream:
        | Awaited<ReturnType<typeof client.threads.runs.run>>
        | Awaited<ReturnType<typeof client.threads.runs.create>>;
      let actualThreadId: string | undefined;

      if (threadId) {
        // Run on existing thread
        stream = await client.threads.runs.run(threadId, {
          message,
          availableComponents,
          tools: availableTools,
        });
        actualThreadId = threadId;
      } else {
        // Create new thread
        stream = await client.threads.runs.create({
          message,
          availableComponents,
          tools: availableTools,
        });
        // threadId will be extracted from first event (RUN_STARTED)
        actualThreadId = undefined;
      }

      // Stream events and dispatch to reducer
      for await (const event of handleEventStream(stream, { debug })) {
        // Extract threadId from RUN_STARTED event if we don't have it yet
        // First event should be RUN_STARTED which contains threadId
        if (!actualThreadId) {
          if (event.type === EventType.RUN_STARTED) {
            const runStartedEvent = event as RunStartedEvent;
            actualThreadId = runStartedEvent.threadId;
          } else {
            throw new Error(
              `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
            );
          }
        }

        dispatch({ type: "EVENT", event, threadId: actualThreadId });

        // TODO Phase 6: Handle awaiting_input for client-side tool execution
        // if (event.type === EventType.CUSTOM && event.name === "tambo.run.awaiting_input") {
        //   await executeToolsAndContinue(event.value.pendingToolCallIds);
        // }
      }

      return { threadId: actualThreadId };
    },
    onSuccess: async (result) => {
      // Invalidate thread queries to refetch updated state
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", result.threadId],
      });
    },
  });
}
