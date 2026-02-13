import { ref, onMounted } from "vue";
import { useTamboContext } from "../provider";

/**
 * Core Tambo composable — provides access to the Tambo client
 * and convenience methods for common operations.
 *
 * Usage:
 * ```vue
 * <script setup>
 * const { client, isReady } = useTambo();
 * </script>
 * ```
 */
export function useTambo() {
  const { client } = useTamboContext();
  const isReady = ref(false);

  onMounted(() => {
    isReady.value = true;
  });

  return {
    client,
    isReady,
  };
}
