import { writable, derived, type Readable } from "svelte/store";
import { getTamboContext } from "../context";
import type { TamboThread, TamboMessage } from "@tambo-ai/typescript-sdk";

export interface TamboThreadStore {
  thread: Readable<TamboThread | null>;
  messages: Readable<TamboMessage[]>;
  isLoading: Readable<boolean>;
  error: Readable<Error | null>;
  createThread: (name?: string) => Promise<TamboThread>;
  loadThread: (threadId: string) => Promise<TamboThread>;
}

/**
 * Create a Tambo thread store for managing conversation threads.
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { createTamboThread } from '@tambo-ai/svelte';
 *   const { thread, messages, createThread } = createTamboThread();
 *   createThread();
 * </script>
 * ```
 */
export function createTamboThread(): TamboThreadStore {
  const { client } = getTamboContext();

  const thread = writable<TamboThread | null>(null);
  const messages = writable<TamboMessage[]>([]);
  const isLoading = writable(false);
  const error = writable<Error | null>(null);

  async function createThread(name?: string): Promise<TamboThread> {
    isLoading.set(true);
    error.set(null);
    try {
      const created = await client.threads.create({ name });
      thread.set(created);
      messages.set([]);
      return created;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    } finally {
      isLoading.set(false);
    }
  }

  async function loadThread(threadId: string): Promise<TamboThread> {
    isLoading.set(true);
    error.set(null);
    try {
      const loaded = await client.threads.get(threadId);
      thread.set(loaded);
      const threadMessages = await client.threads.messages.list(threadId);
      messages.set(threadMessages);
      return loaded;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    } finally {
      isLoading.set(false);
    }
  }

  return {
    thread: { subscribe: thread.subscribe },
    messages: { subscribe: messages.subscribe },
    isLoading: { subscribe: isLoading.subscribe },
    error: { subscribe: error.subscribe },
    createThread,
    loadThread,
  };
}
