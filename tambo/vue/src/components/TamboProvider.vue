<script setup lang="ts">
import { onMounted } from 'vue'
import { TamboPlugin, TamboPluginOptions } from '../plugin'

defineProps<{ options: TamboPluginOptions }>()

// This component is optional sugar: it installs and provides Tambo on mount.
// In most apps, prefer app.use(TamboPlugin, options) at bootstrap instead.
onMounted(() => {
  // no-op here; in SFC usage, users should install via app.use in main.ts
})
</script>

<template>
  <slot />
  <!-- Consumers should install the plugin in main.ts; this component is a passthrough wrapper -->
</template>

