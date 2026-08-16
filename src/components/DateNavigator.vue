<script setup lang="ts">
import { computed } from 'vue'

import type { DateKey } from '../domain/date-key'

const props = defineProps<{
  selectedDate: DateKey
}>()

const emit = defineEmits<{
  change: [date: DateKey]
}>()

function parseDateKey(value: DateKey): Date {
  const [yearText, monthText, dayText] = value.split('-')
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText))
}

function toDateKey(date: Date): DateKey {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}` as DateKey
}

function shiftDate(value: DateKey, days: number): DateKey {
  const date = parseDateKey(value)
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parseDateKey(props.selectedDate)),
)

function move(days: number) {
  emit('change', shiftDate(props.selectedDate, days))
}
</script>

<template>
  <div
    class="flex min-w-0 items-center justify-between gap-3 border-y border-[var(--ds-divider)] py-3"
  >
    <button
      aria-label="이전 날짜"
      class="min-h-11 shrink-0 rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)]"
      type="button"
      @click="move(-1)"
    >
      이전
    </button>

    <time
      :datetime="selectedDate"
      class="min-w-0 flex-1 text-center text-sm leading-6 font-medium text-[var(--ds-ink)] sm:text-base"
    >
      {{ formattedDate }}
    </time>

    <button
      aria-label="다음 날짜"
      class="min-h-11 shrink-0 rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)]"
      type="button"
      @click="move(1)"
    >
      다음
    </button>
  </div>
</template>
