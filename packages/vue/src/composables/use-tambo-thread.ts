import { ref, type Ref } from "vue";
import { useTamboContext } from "../provider";
import type { TamboThread, TamboMessage } from "@tambo-ai/typescript-sdk";

/**
 * Composable for managing a Tambo thread — create, load, and
 * access messages within a conversation thread.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { thread, messages, createThread, loadThread } = useTamboThread();
 * await createThread();
 * </script>
 * ```
 */
export function useTamboThread() {
  const { client } = useTamboContext();
  const thread: Ref<TamboThread | null> = ref(null);
  const messages: Ref<TamboMessage[]> = ref([]);
  const isLoading = ref(false);
  const error: Ref<Error | null> = ref(null);

  async function createThread(name?: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await client.threads.create({ name });
      thread.value = created;
      messages.value = [];
      return created;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadThread(threadId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const loaded = await client.threads.get(threadId);
      thread.value = loaded;
      const threadMessages = await client.threads.messages.list(threadId);
      messages.value = threadMessages;
      return loaded;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    thread,
    messages,
    isLoading,
    error,
    createThread,
    loadThread,
  };
}
