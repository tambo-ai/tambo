"use client";

/**
 * useTamboV1Messages - Messages Hook for v1 API
 *
 * Provides access to messages in a thread with streaming state awareness.
 * Messages are accumulated from AG-UI events during streaming.
 */

import { useMemo } from "react";
import { useStreamState } from "../providers/tambo-v1-stream-context";
import type { TamboV1Message } from "../types/message";

/**
 * Return type for useTamboV1Messages hook
 */
export interface UseTamboV1MessagesReturn {
  /**
   * All messages in the thread
   */
  messages: TamboV1Message[];

  /**
   * The most recent message (last in the list)
   */
  lastMessage: TamboV1Message | undefined;

  /**
   * User messages only
   */
  userMessages: TamboV1Message[];

  /**
   * Assistant messages only
   */
  assistantMessages: TamboV1Message[];

  /**
   * Whether there are any messages
   */
  hasMessages: boolean;

  /**
   * Total message count
   */
  messageCount: number;
}

/**
 * Hook to access messages in a thread.
 *
 * Provides filtered views of messages (user-only, assistant-only)
 * and metadata about the message list.
 * @param threadId - Thread ID to get messages for
 * @returns Message list and utilities
 * @example
 * ```tsx
 * function MessageList({ threadId }: { threadId: string }) {
 *   const { messages, hasMessages, lastMessage } = useTamboV1Messages(threadId);
 *
 *   if (!hasMessages) {
 *     return <EmptyState />;
 *   }
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <Message key={msg.id} message={msg} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1Messages(threadId: string): UseTamboV1MessagesReturn {
  const streamState = useStreamState();
  const threadState = streamState.threadMap[threadId];

  return useMemo(() => {
    const messages = threadState?.thread.messages ?? [];

    return {
      messages,
      lastMessage: messages[messages.length - 1],
      userMessages: messages.filter((m) => m.role === "user"),
      assistantMessages: messages.filter((m) => m.role === "assistant"),
      hasMessages: messages.length > 0,
      messageCount: messages.length,
    };
  }, [threadState?.thread.messages]);
}
