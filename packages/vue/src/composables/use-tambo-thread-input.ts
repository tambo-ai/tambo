import { ref } from "vue";
import { useTamboContext } from "../provider";

/**
 * Composable for managing thread input state — tracks the current
 * message input value and provides a send method.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { input, send, isSending } = useTamboThreadInput(threadId);
 * </script>
 * <template>
 *   <input v-model="input" />
 *   <button @click="send" :disabled="isSending">Send</button>
 * </template>
 * ```
 */
export function useTamboThreadInput(threadId: string) {
  const { client } = useTamboContext();
  const input = ref("");
  const isSending = ref(false);
  const error = ref<Error | null>(null);

  async function send() {
    if (!input.value.trim() || isSending.value) return;

    isSending.value = true;
    error.value = null;
    try {
      await client.threads.runs.create(threadId, {
        message: input.value,
      });
      input.value = "";
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw e;
    } finally {
      isSending.value = false;
    }
  }

  return {
    input,
    isSending,
    error,
    send,
  };
}
