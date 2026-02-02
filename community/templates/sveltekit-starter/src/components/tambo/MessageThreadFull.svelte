<script lang="ts">
  import { cn } from "$lib/utils.js";
  import ThreadContent from "./ThreadContent.svelte";
  import MessageInput from "./MessageInput.svelte";
  import ScrollableContainer from "./ScrollableContainer.svelte";
  import ThreadHistory from "./ThreadHistory.svelte";
  import type { Suggestion } from "@tambo-ai/svelte";

  interface Props {
    contextKey?: string;
    variant?: "default" | "solid";
    showHistory?: boolean;
    historyPosition?: "left" | "right";
    class?: string;
  }

  let {
    contextKey,
    variant = "default",
    showHistory = true,
    historyPosition = "left",
    class: className,
  }: Props = $props();

  // Default suggestions
  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Learn more",
      detailedSuggestion: "Tell me about your capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Show me some example queries I can try.",
      messageId: "examples-query",
    },
  ];
</script>

<div class="flex h-full w-full">
  <!-- Thread History Sidebar - Left -->
  {#if showHistory && historyPosition === "left"}
    <ThreadHistory {contextKey} position="left" />
  {/if}

  <!-- Main Content -->
  <div
    class={cn(
      "flex flex-col flex-1 h-full bg-background transition-all duration-300",
      className,
    )}
  >
    <!-- Messages -->
    <ScrollableContainer class="p-4">
      <ThreadContent {variant} />
    </ScrollableContainer>

    <!-- Message Input -->
    <div class="px-4 pb-4">
      <MessageInput
        {contextKey}
        placeholder="Type your message or paste images..."
      />
    </div>
  </div>

  <!-- Thread History Sidebar - Right -->
  {#if showHistory && historyPosition === "right"}
    <ThreadHistory {contextKey} position="right" />
  {/if}
</div>
