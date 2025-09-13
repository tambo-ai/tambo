<script setup lang="ts">
import { provideTamboMessage } from '../hooks/use-current-message'
import type { TamboThreadMessage } from '../model/generate-component-response'

const props = defineProps<{ message: TamboThreadMessage }>()
provideTamboMessage(props.message)
</script>

<template>
  <slot />
  <!-- Provides current message context to child components -->
</template>

<script setup lang="ts">
import { provide } from 'vue'
import type { TamboThreadMessage } from '../model/generate-component-response'
import { TamboMessageKey } from '../hooks/use-current-message'

defineProps<{ message: TamboThreadMessage }>()

// In Vue, providers are typically set up by parent components. This SFC forwards the message via provide.
provide(TamboMessageKey, (defineProps as any)().message)
</script>

<template>
  <slot />
</template>

