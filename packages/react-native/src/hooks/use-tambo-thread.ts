import { useState, useCallback } from "react";
import { useTamboContext } from "../provider";
import type { TamboThread, TamboMessage } from "@tambo-ai/typescript-sdk";

/**
 * Hook for managing Tambo threads in React Native.
 */
export function useTamboThread() {
  const { client } = useTamboContext();
  const [thread, setThread] = useState<TamboThread | null>(null);
  const [messages, setMessages] = useState<TamboMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createThread = useCallback(
    async (name?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const created = await client.threads.create({ name });
        setThread(created);
        setMessages([]);
        return created;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const loadThread = useCallback(
    async (threadId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await client.threads.get(threadId);
        setThread(loaded);
        const threadMessages = await client.threads.messages.list(threadId);
        setMessages(threadMessages);
        return loaded;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return { thread, messages, isLoading, error, createThread, loadThread };
}
