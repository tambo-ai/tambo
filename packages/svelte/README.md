# @tambo-ai/svelte

Svelte SDK for [Tambo](https://tambo.co) — build AI-powered generative UI applications with Svelte.

## Installation

```bash
npm install @tambo-ai/svelte @tambo-ai/typescript-sdk svelte
```

## Quick Start

### Root Layout

```svelte
<script>
  import { createTamboClient } from '@tambo-ai/svelte';
  createTamboClient({ apiKey: import.meta.env.VITE_TAMBO_API_KEY });
</script>

<slot />
```

### Chat Component

```svelte
<script>
  import { createTamboThread, createTamboThreadInput } from '@tambo-ai/svelte';
  import { onMount } from 'svelte';

  const { thread, messages, createThread } = createTamboThread();
  let threadInput;

  onMount(async () => {
    const t = await createThread();
    threadInput = createTamboThreadInput(t.id);
  });
</script>

{#if threadInput}
  {#each $messages as msg}
    <p>{msg.content}</p>
  {/each}
  <input bind:value={$threadInput.input} />
  <button on:click={threadInput.send}>Send</button>
{/if}
```

## Stores

| Store | Description |
|-------|-------------|
| `createTamboClient(options)` | Initialize Tambo client in Svelte context |
| `createTamboThread()` | Create and manage conversation threads |
| `createTamboThreadInput(threadId)` | Manage input state and send messages |

## Documentation

See [tambo.co/docs](https://docs.tambo.co) for full documentation.
