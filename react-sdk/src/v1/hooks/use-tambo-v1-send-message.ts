"use client";

/**
 * Send Message Hook for v1 API
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
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
 * Hook to send a message in a thread and handle streaming responses.
 *
 * This hook:
 * - Sends a user message to the API
 * - Streams AG-UI events in real-time
 * - Dispatches events to the stream reducer
 * - Handles tool execution (Phase 6)
 * - Invalidates thread queries on completion
 * @param threadId - Thread ID to send message to
 * @returns React Query mutation object
 * @example
 * ```tsx
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
 *       {sendMessage.isError && <Error error={sendMessage.error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1SendMessage(threadId: string) {
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

      // Start run on existing thread with message + available components/tools
      const streamPromise = client.threads.runs.run(threadId, {
        message,
        availableComponents,
        tools: availableTools,
      });

      // Await the stream and iterate over events
      const stream = await streamPromise;

      // Stream events and dispatch to reducer
      // Note: SDK returns RunRunResponse events with type: string
      for await (const event of handleEventStream(stream, { debug })) {
        dispatch({ type: "EVENT", event });

        // TODO Phase 6: Handle awaiting_input for client-side tool execution
        // if (event.type === "CUSTOM" && event.name === "tambo.run.awaiting_input") {
        //   await executeToolsAndContinue(event.value.pendingToolCallIds);
        // }
      }
    },
    onSuccess: async () => {
      // Invalidate thread queries to refetch updated state
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", threadId],
      });
    },
  });
}
