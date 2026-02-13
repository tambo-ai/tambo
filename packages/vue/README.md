# @tambo-ai/vue

Vue 3 SDK for [Tambo](https://tambo.co) — build AI-powered generative UI applications with Vue.

## Installation

```bash
npm install @tambo-ai/vue @tambo-ai/typescript-sdk vue
```

## Quick Start

```vue
<script setup>
import { TamboProvider, useTamboThread, useTamboThreadInput } from '@tambo-ai/vue';
</script>

<template>
  <TamboProvider :api-key="apiKey">
    <ChatComponent />
  </TamboProvider>
</template>
```

### Chat Component

```vue
<script setup>
import { useTamboThread, useTamboThreadInput } from '@tambo-ai/vue';
import { onMounted } from 'vue';

const { thread, messages, createThread } = useTamboThread();
const threadId = computed(() => thread.value?.id ?? '');
const { input, send, isSending } = useTamboThreadInput(threadId.value);

onMounted(() => createThread());
</script>

<template>
  <div>
    <div v-for="msg in messages" :key="msg.id">
      {{ msg.content }}
    </div>
    <input v-model="input" @keydown.enter="send" />
    <button @click="send" :disabled="isSending">Send</button>
  </div>
</template>
```

## Composables

| Composable | Description |
|-----------|-------------|
| `useTambo()` | Access the Tambo client instance |
| `useTamboThread()` | Create and manage conversation threads |
| `useTamboThreadInput(threadId)` | Manage input state and send messages |

## Documentation

See [tambo.co/docs](https://docs.tambo.co) for full documentation.
