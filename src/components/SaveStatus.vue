<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isSaving: boolean
  error: string | null
  lastSavedAt: string | null
}>()

const formattedSavedAt = computed(() => {
  if (!props.lastSavedAt) {
    return ''
  }

  const date = new Date(props.lastSavedAt)

  if (Number.isNaN(date.getTime())) {
    return '저장됨'
  }

  return `저장됨 · ${new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
})

const message = computed(() => {
  if (props.error) {
    return props.error
  }

  if (props.isSaving) {
    return '저장 중...'
  }

  if (props.lastSavedAt) {
    return formattedSavedAt.value
  }

  return ''
})
</script>

<template>
  <p
    aria-live="polite"
    class="min-h-6 text-sm leading-6"
    :class="error ? 'text-[var(--ds-danger)]' : 'text-[var(--ds-muted)]'"
    role="status"
  >
    {{ message }}
  </p>
</template>
