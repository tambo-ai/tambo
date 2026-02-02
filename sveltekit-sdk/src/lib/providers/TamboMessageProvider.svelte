<script lang="ts" module>
  import type { TamboThreadMessage } from "../types.js";

  export interface TamboMessageContext {
    message: TamboThreadMessage | null;
  }
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import type { Snippet } from "svelte";
  import { TAMBO_MESSAGE_KEY } from "../context.js";

  interface Props {
    message: TamboThreadMessage | null;
    children: Snippet;
  }

  const { message, children }: Props = $props();

  // Create reactive context that updates when message changes
  const context: TamboMessageContext = {
    get message() {
      return message;
    },
  };

  setContext(TAMBO_MESSAGE_KEY, context);
</script>

{@render children()}
