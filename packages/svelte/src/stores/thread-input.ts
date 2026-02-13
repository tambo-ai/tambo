import { writable, type Readable } from "svelte/store";
import { getTamboContext } from "../context";

export interface TamboThreadInputStore {
  input: ReturnType<typeof writable<string>>;
  isSending: Readable<boolean>;
  error: Readable<Error | null>;
  send: () => Promise<void>;
}

/**
 * Create a thread input store for managing message input and sending.
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { createTamboThreadInput } from '@tambo-ai/svelte';
 *   const { input, send, isSending } = createTamboThreadInput(threadId);
 * </script>
 * <input bind:value={$input} />
 * <button on:click={send} disabled={$isSending}>Send</button>
 * ```
 */
export function createTamboThreadInput(threadId: string): TamboThreadInputStore {
  const { client } = getTamboContext();
  const input = writable("");
  const isSending = writable(false);
  const error = writable<Error | null>(null);

  async function send(): Promise<void> {
    let currentInput = "";
    input.subscribe((v) => (currentInput = v))();

    if (!currentInput.trim()) return;

    isSending.set(true);
    error.set(null);
    try {
      await client.threads.runs.create(threadId, {
        message: currentInput,
      });
      input.set("");
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    } finally {
      isSending.set(false);
    }
  }

  return {
    input,
    isSending: { subscribe: isSending.subscribe },
    error: { subscribe: error.subscribe },
    send,
  };
}
