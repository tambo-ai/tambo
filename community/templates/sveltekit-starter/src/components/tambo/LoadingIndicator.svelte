<script lang="ts">
  import { cn } from "$lib/utils.js";

  interface Props {
    class?: string;
  }

  let { class: className }: Props = $props();
</script>

<div class={cn("flex items-center gap-1", className)}>
  <span class="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
  <span class="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
  <span class="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
</div>
