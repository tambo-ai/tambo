<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { getTamboContext } from "$lib/tambo/context.js";
  import {
    ArrowLeftToLine,
    ArrowRightToLine,
    MoreHorizontal,
    Pencil,
    PlusIcon,
    SearchIcon,
    Sparkles,
  } from "lucide-svelte";
  import type { TamboThread } from "$lib/tambo/types.js";
  import { onMount } from "svelte";

  interface Props {
    contextKey?: string;
    position?: "left" | "right";
    defaultCollapsed?: boolean;
    onThreadChange?: () => void;
    class?: string;
  }

  let {
    contextKey,
    position = "left",
    defaultCollapsed = true,
    onThreadChange,
    class: className,
  }: Props = $props();

  const tambo = getTamboContext();
  const { thread } = tambo;

  let isCollapsed = $state(true);
  let searchQuery = $state("");
  let isLoading = $state(false);
  let threads = $state<TamboThread[]>([]);
  let editingThread = $state<TamboThread | null>(null);
  let newName = $state("");
  let showDropdown = $state<string | null>(null);

  // Update CSS variable when collapsed state changes
  $effect(() => {
    const sidebarWidth = isCollapsed ? "3rem" : "16rem";
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
  });

  // Fetch threads on mount
  onMount(async () => {
    await fetchThreads();
  });

  async function fetchThreads() {
    isLoading = true;
    try {
      threads = await thread.fetchThreads(contextKey);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      isLoading = false;
    }
  }

  async function handleNewThread() {
    try {
      await thread.startNewThread(contextKey);
      await fetchThreads();
      onThreadChange?.();
    } catch (err) {
      console.error("Failed to create new thread:", err);
    }
  }

  async function handleSwitchThread(threadId: string) {
    try {
      await thread.switchThread(threadId);
      onThreadChange?.();
    } catch (err) {
      console.error("Failed to switch thread:", err);
    }
  }

  async function handleRename(t: TamboThread) {
    editingThread = t;
    newName = t.name ?? "";
    showDropdown = null;
  }

  async function handleGenerateName(t: TamboThread) {
    try {
      await thread.generateThreadName(t.id);
      await fetchThreads();
    } catch (err) {
      console.error("Failed to generate name:", err);
    }
    showDropdown = null;
  }

  async function handleNameSubmit(e: Event) {
    e.preventDefault();
    if (!editingThread) return;

    try {
      await thread.updateThreadName(newName, editingThread.id);
      await fetchThreads();
      editingThread = null;
    } catch (err) {
      console.error("Failed to rename thread:", err);
    }
  }

  // Filter threads based on search
  const filteredThreads = $derived(
    isCollapsed
      ? []
      : threads.filter((t) => {
          const query = searchQuery.toLowerCase();
          return (
            t.id.toLowerCase().includes(query) ||
            (t.name?.toLowerCase().includes(query) ?? false)
          );
        })
  );

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
</script>

<div
  class={cn(
    "border-flat bg-container h-full transition-all duration-300 flex-none",
    position === "left" ? "border-r" : "border-l",
    isCollapsed ? "w-12" : "w-64",
    className
  )}
>
  <div class={cn("flex flex-col h-full", isCollapsed ? "py-4 px-2" : "p-4")}>
    <!-- Header -->
    <div class="flex items-center mb-4 relative p-1">
      <h2
        class={cn(
          "text-sm text-muted-foreground whitespace-nowrap",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden"
            : "opacity-100 max-w-none transition-all duration-300 delay-75"
        )}
      >
        Tambo Conversations
      </h2>
      <button
        type="button"
        onclick={() => (isCollapsed = !isCollapsed)}
        class={cn(
          "bg-container p-1 hover:bg-backdrop transition-colors rounded-md cursor-pointer absolute flex items-center justify-center",
          position === "left" ? "right-1" : "left-0"
        )}
      >
        {#if isCollapsed}
          <ArrowRightToLine class={cn("h-4 w-4", position === "right" && "rotate-180")} />
        {:else}
          <ArrowLeftToLine class={cn("h-4 w-4", position === "right" && "rotate-180")} />
        {/if}
      </button>
    </div>

    <!-- New Thread Button -->
    <button
      type="button"
      onclick={handleNewThread}
      class={cn(
        "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
        isCollapsed ? "p-1 justify-center" : "p-2 gap-2"
      )}
    >
      <PlusIcon class="h-4 w-4 bg-green-600 rounded-full text-white" />
      <span
        class={cn(
          "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px]",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
            : "opacity-100 transition-all duration-300 delay-100"
        )}
      >
        New thread
      </span>
    </button>

    <!-- Search -->
    <div class="mb-4 relative">
      {#if isCollapsed}
        <button
          type="button"
          onclick={() => (isCollapsed = false)}
          class="p-1 hover:bg-backdrop rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2"
        >
          <SearchIcon class="h-4 w-4 text-gray-400" />
        </button>
      {:else}
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon class="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            class="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-container focus:outline-none"
            placeholder="Search..."
            bind:value={searchQuery}
          />
        </div>
      {/if}
    </div>

    <!-- Thread List -->
    <div
      class={cn(
        "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "opacity-0 max-h-0 overflow-hidden pointer-events-none"
          : "opacity-100 max-h-full pointer-events-auto"
      )}
    >
      {#if isLoading}
        <div class="text-sm text-muted-foreground p-2">Loading threads...</div>
      {:else if filteredThreads.length === 0}
        <div class="text-sm text-muted-foreground p-2">
          {searchQuery ? "No matching threads" : "No previous threads"}
        </div>
      {:else}
        <div class="space-y-1">
          {#each filteredThreads as t (t.id)}
            <div
              role="button"
              tabindex="0"
              class={cn(
                "p-2 rounded-md hover:bg-backdrop cursor-pointer group flex items-center justify-between",
                thread.currentThreadId === t.id && "bg-muted",
                editingThread?.id === t.id && "bg-muted"
              )}
              onclick={() => handleSwitchThread(t.id)}
              onkeydown={(e) => e.key === "Enter" && handleSwitchThread(t.id)}
            >
              <div class="text-sm flex-1">
                {#if editingThread?.id === t.id}
                  <form onsubmit={handleNameSubmit} class="flex flex-col gap-1">
                    <input
                      type="text"
                      bind:value={newName}
                      class="w-full bg-background px-1 text-sm font-medium focus:outline-none rounded-sm"
                      onclick={(e) => e.stopPropagation()}
                      placeholder="Thread name..."
                    />
                    <p class="text-xs text-muted-foreground truncate">
                      {formatDate(t.createdAt)}
                    </p>
                  </form>
                {:else}
                  <span class="font-medium line-clamp-1">
                    {t.name ?? `Thread ${t.id.substring(0, 8)}`}
                  </span>
                  <p class="text-xs text-muted-foreground truncate mt-1">
                    {formatDate(t.createdAt)}
                  </p>
                {/if}
              </div>

              <!-- Options dropdown -->
              <div class="relative">
                <button
                  type="button"
                  class="p-1 hover:bg-backdrop rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onclick={(e) => {
                    e.stopPropagation();
                    showDropdown = showDropdown === t.id ? null : t.id;
                  }}
                >
                  <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
                </button>

                {#if showDropdown === t.id}
                  <div
                    class="absolute right-0 top-8 min-w-[160px] text-xs bg-popover rounded-md p-1 shadow-md border border-border z-10"
                  >
                    <button
                      type="button"
                      class="flex items-center gap-2 px-2 py-1.5 w-full text-left text-foreground hover:bg-backdrop rounded-sm cursor-pointer"
                      onclick={(e) => {
                        e.stopPropagation();
                        handleRename(t);
                      }}
                    >
                      <Pencil class="h-3 w-3" />
                      Rename
                    </button>
                    <button
                      type="button"
                      class="flex items-center gap-2 px-2 py-1.5 w-full text-left text-foreground hover:bg-backdrop rounded-sm cursor-pointer"
                      onclick={(e) => {
                        e.stopPropagation();
                        handleGenerateName(t);
                      }}
                    >
                      <Sparkles class="h-3 w-3" />
                      Generate Name
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
