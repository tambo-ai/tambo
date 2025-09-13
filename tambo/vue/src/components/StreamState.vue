<script setup lang="ts">
import { computed } from 'vue'
import { useTamboStream } from '../providers/tambo-prop-stream-provider'
import { DEFAULT_STREAM_KEY } from '../providers/tambo-prop-stream-provider/types'

const props = defineProps<{ streamKey?: string }>()
const { getStatusForKey } = useTamboStream()
const status = computed(() => getStatusForKey(props.streamKey ?? DEFAULT_STREAM_KEY))
</script>

<template>
  <slot :status="status" />
</template>

