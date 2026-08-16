<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="space-y-3 border-y border-[var(--ds-divider)] py-8 text-center">
    <h2 class="text-lg font-semibold text-[var(--ds-ink)]">
      {{ props.title }}
    </h2>
    <p class="text-sm leading-6 text-[var(--ds-muted)]">
      {{ props.description }}
    </p>
    <div v-if="props.actionLabel" class="pt-1">
      <button
        class="min-h-11 rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        type="button"
        @click="emit('action')"
      >
        {{ props.actionLabel }}
      </button>
    </div>
  </section>
</template>
