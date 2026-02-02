<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { useTamboThread } from "@tambo-ai/svelte";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children }: Props = $props();

  const thread = useTamboThread();

  let containerRef = $state<HTMLDivElement | null>(null);
  let isNearBottom = $state(true);

  // Track message count to detect new messages
  const messageCount = $derived(thread.messages.length);
  let previousMessageCount = $state(0);

  // Scroll to bottom when new messages arrive (if user is near bottom)
  $effect(() => {
    if (messageCount > previousMessageCount && isNearBottom && containerRef) {
      scrollToBottom();
    }
    previousMessageCount = messageCount;
  });

  // Also scroll when generation stage changes
  $effect(() => {
    if (!thread.isIdle && isNearBottom && containerRef) {
      scrollToBottom();
    }
  });

  function scrollToBottom() {
    if (containerRef) {
      containerRef.scrollTo({
        top: containerRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  function handleScroll() {
    if (containerRef) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef;
      // Consider "near bottom" if within 100px of the bottom
      isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    }
  }
</script>

<div
  bind:this={containerRef}
  onscroll={handleScroll}
  class={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}
  data-slot="scrollable-container"
>
  {#if children}
    {@render children()}
  {/if}
</div>
