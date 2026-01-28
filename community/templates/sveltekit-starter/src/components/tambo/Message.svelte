<script lang="ts">
  import { cn } from "$lib/utils.js";
  import MessageContent from "./MessageContent.svelte";
  import { ChevronDown, Check, Loader2, X } from "lucide-svelte";
  import type { TamboThreadMessage, ContentPart } from "$lib/tambo/types.js";
  import { getTamboContext } from "$lib/tambo/context.js";
  import type { Snippet } from "svelte";

  type ToolCallRequest = NonNullable<TamboThreadMessage["toolCallRequest"]>;

  interface Props {
    role: "user" | "assistant";
    message: TamboThreadMessage;
    variant?: "default" | "solid";
    isLoading?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    role,
    message,
    variant = "default",
    isLoading = false,
    class: className,
    children,
  }: Props = $props();

  // Don't render tool messages directly
  const shouldRender = $derived(message.role !== "tool");

  // Tool call state
  let toolExpanded = $state(false);

  /**
   * Get tool call request from message
   */
  function getToolCallRequest(): ToolCallRequest | undefined {
    return message.toolCallRequest ?? message.component?.toolCallRequest;
  }

  /**
   * Get images from message content
   */
  function getMessageImages(
    content: string | ContentPart[] | null | undefined
  ): string[] {
    if (!content || !Array.isArray(content)) return [];
    return content
      .filter((item) => item?.type === "image_url" && item.image_url?.url)
      .map((item) => (item as { type: "image_url"; image_url: { url: string } }).image_url.url);
  }

  const images = $derived(getMessageImages(message.content));
  const hasToolCall = $derived(!!getToolCallRequest());
  const toolCallRequest = $derived(getToolCallRequest());

  // Get component from registry if rendered
  const tambo = getTamboContext();

  const registeredComponent = $derived(
    message.component?.name ? tambo.thread.getComponent(message.component.name) : undefined
  );

  /**
   * Format tool parameters for display
   */
  function formatParameters(
    params: ToolCallRequest["parameters"]
  ): Record<string, unknown> {
    if (!params) return {};
    return Object.fromEntries(params.map((p) => [p.parameterName, p.parameterValue]));
  }
</script>

{#if shouldRender}
  <div
    class={cn(
      "flex",
      variant === "solid" &&
        "[&>div>div:first-child]:shadow-md [&>div>div:first-child]:bg-container/50",
      className
    )}
    data-message-role={role}
    data-message-id={message.id}
  >
    {#if children}
      {@render children()}
    {:else}
      <div class={cn("flex flex-col", role === "assistant" ? "w-full" : "max-w-3xl")}>
        <!-- Reasoning info (for models with extended thinking) -->
        {#if message.reasoning && message.reasoning.length > 0}
          <div class="flex flex-col items-start text-xs opacity-50 mb-2">
            <button
              type="button"
              class="flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1"
              onclick={() => (toolExpanded = !toolExpanded)}
            >
              <span class={isLoading ? "animate-thinking-gradient" : ""}>
                {isLoading ? "Thinking..." : "Done Thinking"}
                {message.reasoning.length > 1 ? `(${message.reasoning.length} steps)` : ""}
              </span>
              <ChevronDown
                class={cn("w-3 h-3 transition-transform duration-200", !toolExpanded && "-rotate-90")}
              />
            </button>
            {#if toolExpanded}
              <div class="flex flex-col gap-1 px-3 py-3 max-h-96 overflow-auto">
                {#each message.reasoning as step, index}
                  <div class="flex flex-col gap-1">
                    {#if message.reasoning.length > 1}
                      <span class="text-muted-foreground text-xs font-medium">Step {index + 1}:</span>
                    {/if}
                    <div class="bg-muted/50 rounded-md p-3 text-xs whitespace-pre-wrap">
                      {step}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Images -->
        {#if images.length > 0}
          <div class="flex flex-wrap gap-2 mb-2">
            {#each images as imageUrl, index}
              <div class="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  class="w-full h-full object-cover"
                />
              </div>
            {/each}
          </div>
        {/if}

        <!-- Message content -->
        <MessageContent
          content={message.content}
          {isLoading}
          class={role === "assistant"
            ? "text-foreground font-sans"
            : "text-foreground bg-container hover:bg-backdrop font-sans"}
        />

        <!-- Tool call info -->
        {#if hasToolCall && role === "assistant"}
          <div class="flex flex-col items-start text-xs opacity-50 mt-2">
            <button
              type="button"
              class="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1"
              onclick={() => (toolExpanded = !toolExpanded)}
            >
              {#if message.error}
                <X class="w-3 h-3 text-red-500" />
              {:else if isLoading}
                <Loader2 class="w-3 h-3 animate-spin" />
              {:else}
                <Check class="w-3 h-3 text-green-500" />
              {/if}
              <span>
                {isLoading ? "Calling" : "Called"} {toolCallRequest?.toolName ?? "tool"}
              </span>
              <ChevronDown
                class={cn("w-3 h-3 transition-transform duration-200", !toolExpanded && "-rotate-90")}
              />
            </button>
            {#if toolExpanded && toolCallRequest}
              <div class="flex flex-col gap-1 p-3 pl-7 overflow-auto">
                <span class="whitespace-pre-wrap pl-2">tool: {toolCallRequest.toolName}</span>
                <span class="whitespace-pre-wrap pl-2">
                  parameters: {JSON.stringify(formatParameters(toolCallRequest.parameters), null, 2)}
                </span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Rendered component -->
        {#if message.component && registeredComponent && role === "assistant" && !message.isCancelled}
          {@const DynamicComponent = registeredComponent.component}
          <div class="w-full pt-2 px-2">
            <DynamicComponent
              {...message.component.props}
            />
          </div>
        {/if}

        <!-- Cancelled indicator -->
        {#if message.isCancelled}
          <span class="text-muted-foreground text-xs px-4">cancelled</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}
