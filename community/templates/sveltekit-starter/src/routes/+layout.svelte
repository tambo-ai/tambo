<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { TamboProvider } from "@tambo-ai/svelte";
  import { components, tools } from "../config/tambo.js";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>SvelteKit Tambo Starter</title>
</svelte:head>

<TamboProvider apiKey={import.meta.env.VITE_TAMBO_API_KEY} {components} {tools}>
  {@render children()}
</TamboProvider>
