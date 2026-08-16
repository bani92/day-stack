<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="space-y-3">
    <label for="archive-search" class="block text-base font-semibold text-[var(--ds-ink)]">
      기록 검색
    </label>

    <div class="flex items-center gap-2 rounded-[8px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] px-4">
      <input
        id="archive-search"
        :value="props.modelValue"
        autocomplete="off"
        class="min-h-11 w-full border-0 bg-transparent py-3 text-base text-[var(--ds-ink)] outline-none placeholder:text-[var(--ds-muted)]"
        placeholder="날짜나 기록 내용을 검색해보세요"
        type="search"
        @input="updateValue"
      />

      <button
        v-if="props.modelValue !== ''"
        aria-label="검색어 지우기"
        class="min-h-11 shrink-0 rounded-[8px] px-2 text-sm font-medium text-[var(--ds-muted)] transition-colors hover:text-[var(--ds-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        type="button"
        @click="clear"
      >
        지우기
      </button>
    </div>
  </div>
</template>
