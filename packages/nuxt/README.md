# @tambo-ai/nuxt

Nuxt 3 module for [Tambo](https://tambo.co) — build AI-powered generative UI applications with Nuxt.

## Installation

```bash
npm install @tambo-ai/nuxt @tambo-ai/typescript-sdk
```

## Setup

Add the module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@tambo-ai/nuxt'],
  tambo: {
    apiKey: process.env.TAMBO_API_KEY,
  },
});
```

## Usage

Composables are auto-imported — no import statements needed:

```vue
<script setup>
const { thread, messages, createThread } = useTamboThread();
const { input, send, isSending } = useTamboThreadInput(thread.value?.id ?? '');

onMounted(() => createThread());
</script>

<template>
  <div>
    <div v-for="msg in messages" :key="msg.id">{{ msg.content }}</div>
    <input v-model="input" @keydown.enter="send" />
    <button @click="send" :disabled="isSending">Send</button>
  </div>
</template>
```

## Configuration

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | Tambo API key (or set `NUXT_PUBLIC_TAMBO_API_KEY`) |
| `apiUrl` | `string` | Custom API URL (optional) |

## Documentation

See [tambo.co/docs](https://docs.tambo.co) for full documentation.
