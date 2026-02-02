<script lang="ts">
  import MessageThreadFull from "../components/tambo/MessageThreadFull.svelte";
  import { Sun, Moon } from "lucide-svelte";
  import { onMount } from "svelte";

  // Dark mode state
  let isDark = $state(false);

  onMount(() => {
    // Check initial preference
    isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  });

  function toggleDarkMode() {
    isDark = !isDark;
    document.documentElement.classList.toggle("dark", isDark);
  }

  // Check for API key
  const hasApiKey = $derived(!!import.meta.env.VITE_TAMBO_API_KEY);
</script>

<div class="h-screen w-full flex flex-col">
  <!-- Header -->
  <header
    class="flex items-center justify-between px-4 py-2 border-b border-border bg-background"
  >
    <div class="flex items-center gap-2">
      <h1 class="text-lg font-semibold text-foreground">Tambo AI</h1>
      <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
        >SvelteKit</span
      >
    </div>
    <button
      type="button"
      onclick={toggleDarkMode}
      class="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
      aria-label="Toggle dark mode"
    >
      {#if isDark}
        <Sun class="h-4 w-4" />
      {:else}
        <Moon class="h-4 w-4" />
      {/if}
    </button>
  </header>

  <!-- Main Content -->
  {#if !hasApiKey}
    <div class="flex-1 flex items-center justify-center p-4">
      <div class="max-w-md text-center space-y-4">
        <h2 class="text-xl font-semibold text-foreground">API Key Required</h2>
        <p class="text-muted-foreground">
          To get started, create a <code class="bg-muted px-1 rounded"
            >.env</code
          > file in the project root with your Tambo API key:
        </p>
        <pre class="bg-muted p-4 rounded-lg text-sm text-left"><code
            >VITE_TAMBO_API_KEY=your_api_key_here</code
          ></pre>
        <p class="text-sm text-muted-foreground">
          Get your API key at <a
            href="https://tambo.co"
            class="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer">tambo.co</a
          >
        </p>
      </div>
    </div>
  {:else}
    <div class="flex-1 overflow-hidden">
      <MessageThreadFull contextKey="tambo-template" />
    </div>
  {/if}
</div>
