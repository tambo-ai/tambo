<script setup lang="ts">
import { computed } from 'vue'
import { useTamboStream } from './provider'

const props = defineProps<{ streamKey?: string }>()
const { getStatusForKey } = useTamboStream()
const status = computed(() => getStatusForKey(props.streamKey ?? 'default'))
</script>

<template>
  <slot v-if="status.isSuccess && !status.isError" />
</template>

