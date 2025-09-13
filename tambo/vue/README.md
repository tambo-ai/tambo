@tambo-ai/vue (Experimental)

Vue 3 SDK for Tambo AI. Vue-first API with plugin + composables and slot-based stream components.

Status: Experimental. Interfaces may change. If you find an issue, please open a PR with a fix or a reproduction.

Quickstart

```bash
npm install @tambo-ai/vue vue @tanstack/vue-query
```

main.ts:

```ts
import { createApp } from 'vue'
import { TamboPlugin } from '@tambo-ai/vue'
import App from './App.vue'

const app = createApp(App)
app.use(TamboPlugin, {
  apiKey: import.meta.env.VITE_TAMBO_API_KEY,
  components: [],
  tools: [],
  contextHelpers: {},
  streaming: true,
})
app.mount('#app')
```

In a component:

```ts
import { useTamboThread, useTamboSuggestions } from '@tambo-ai/vue'

const { thread, sendThreadMessage } = useTamboThread()
const { suggestions, accept } = useTamboSuggestions()
```

Stream status components:

```vue
<TamboPropStreamProvider>
  <Pending>Loading…</Pending>
  <Streaming>Streaming…</Streaming>
  <Success><YourComponent /></Success>
</TamboPropStreamProvider>
```

Notes

- Requires Vue 3 and @tanstack/vue-query installed in the host app.
- SSR: some features are browser-only (streaming, crypto). Guard usage in SSR and call in onMounted() where needed.

Contributing

- Experimental package: small, focused PRs welcome. Please include tests.

