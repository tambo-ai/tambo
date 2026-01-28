<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { getTamboContext } from "$lib/tambo/context.js";
  import Message from "./Message.svelte";
  import type { TamboThreadMessage } from "$lib/tambo/types.js";

  interface Props {
    variant?: "default" | "solid";
    class?: string;
  }

  let { variant = "default", class: className }: Props = $props();

  const tambo = getTamboContext();
  const { thread } = tambo;

  // Filter messages to exclude system messages and child messages
  const filteredMessages = $derived(
    thread.messages.filter(
      (message) => message.role !== "system" && !message.parentMessageId,
    ),
  );

  const isGenerating = $derived(!thread.isIdle);
</script>

<div class={cn("w-full", className)} data-slot="thread-content-container">
  <div class="flex flex-col gap-2" data-slot="thread-content-messages">
    {#each filteredMessages as message, index (message.id || `${message.role}-${index}`)}
      <div data-slot="thread-content-item">
        <Message
          role={message.role === "assistant" ? "assistant" : "user"}
          {message}
          {variant}
          isLoading={isGenerating && index === filteredMessages.length - 1}
          class={cn(
            "flex w-full",
            message.role === "assistant" ? "justify-start" : "justify-end",
          )}
        />
      </div>
    {/each}
  </div>
</div>
