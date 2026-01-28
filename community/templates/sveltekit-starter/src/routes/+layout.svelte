<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { createTamboContext } from "$lib/tambo/context.js";
  import { components, tools } from "../config/tambo.js";

  let { children } = $props();

  // Initialize Tambo context with components and tools
  const tambo = createTamboContext({
    apiKey: import.meta.env.VITE_TAMBO_API_KEY,
    components,
    tools,
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>SvelteKit Tambo Starter</title>
</svelte:head>

{@render children()}
