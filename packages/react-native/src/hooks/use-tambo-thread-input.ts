import { useState, useCallback } from "react";
import { useTamboContext } from "../provider";

/**
 * Hook for managing thread input in React Native.
 */
export function useTamboThreadInput(threadId: string) {
  const { client } = useTamboContext();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await client.threads.runs.create(threadId, {
        message: input,
      });
      setInput("");
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [client, threadId, input, isSending]);

  return { input, setInput, isSending, error, send };
}
