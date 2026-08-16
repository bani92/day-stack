<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { DateKey } from '../domain/date-key'

const props = defineProps<{
  dates: DateKey[]
  noSavedLogs: boolean
}>()

const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', {
  weekday: 'long',
})

function toLocalDate(dateKey: DateKey): Date {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function formatDate(dateKey: DateKey): string {
  const date = toLocalDate(dateKey)

  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function formatWeekday(dateKey: DateKey): string {
  return weekdayFormatter.format(toLocalDate(dateKey))
}
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-[var(--ds-ink)]">기록된 날짜</h2>
      <p class="mt-1 text-sm leading-6 text-[var(--ds-muted)]">
        기록을 선택하면 해당 날짜의 내용을 다시 볼 수 있습니다.
      </p>
    </div>

    <ol v-if="props.dates.length > 0" class="border-t border-[var(--ds-divider)]">
      <li v-for="date in props.dates" :key="date" class="border-b border-[var(--ds-divider)]">
        <RouterLink
          :to="`/day/${date}`"
          class="flex min-h-11 items-center justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        >
          <span class="flex min-w-0 items-baseline gap-3">
            <time :datetime="date" class="font-medium text-[var(--ds-ink)]">
              {{ formatDate(date) }}
            </time>
            <span class="text-sm text-[var(--ds-muted)]">{{ formatWeekday(date) }}</span>
          </span>
          <span aria-hidden="true" class="shrink-0 text-[var(--ds-muted)]">→</span>
        </RouterLink>
      </li>
    </ol>

    <p
      v-else
      class="border-y border-[var(--ds-divider)] py-8 text-center text-sm leading-6 text-[var(--ds-muted)]"
    >
      {{ props.noSavedLogs ? '아직 기록이 없습니다.' : '선택한 달에는 기록된 날짜가 없습니다.' }}
    </p>
  </section>
</template>
