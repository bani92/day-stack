<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import type { DateKey } from '../domain/date-key'
import type {
  SearchField as SearchFieldKey,
  SearchResult,
} from '../domain/search-logs'

const props = defineProps<{
  results: SearchResult[]
}>()

const FIELD_LABELS: Record<SearchFieldKey, string> = {
  done: '오늘 한 일',
  learned: '배운 점',
  blocked: '막힌 점',
  next: '다음에 이어갈 일',
}

const FIELD_CLASSES: Record<SearchFieldKey, string> = {
  done: 'field-label--done',
  learned: 'field-label--learned',
  blocked: 'field-label--blocked',
  next: 'field-label--next',
}

const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', {
  weekday: 'long',
})

function toDayPath(date: DateKey): string {
  return `/day/${date}`
}

function toLocalDate(date: DateKey): Date {
  const [year, month, day] = date.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function formatWeekday(date: DateKey): string {
  return weekdayFormatter.format(toLocalDate(date))
}

function toMonthKey(date: DateKey): string {
  return date.slice(0, 7)
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')

  return `${year}년 ${Number(month)}월`
}

const sortedResults = computed(() =>
  [...props.results].sort((left, right) => right.log.date.localeCompare(left.log.date)),
)

const monthGroups = computed(() => {
  const groups = new Map<string, SearchResult[]>()

  for (const result of sortedResults.value) {
    const monthKey = toMonthKey(result.log.date)
    const monthResults = groups.get(monthKey) ?? []

    monthResults.push(result)
    groups.set(monthKey, monthResults)
  }

  return [...groups].map(([key, results]) => ({
    key,
    label: formatMonth(key),
    panelId: `timeline-month-${key}`,
    results,
  }))
})

const expandedMonths = ref<Set<string>>(
  new Set(monthGroups.value[0] ? [monthGroups.value[0].key] : []),
)

function isMonthExpanded(monthKey: string): boolean {
  return expandedMonths.value.has(monthKey)
}

function toggleMonth(monthKey: string): void {
  const nextExpandedMonths = new Set(expandedMonths.value)

  if (nextExpandedMonths.has(monthKey)) {
    nextExpandedMonths.delete(monthKey)
  } else {
    nextExpandedMonths.add(monthKey)
  }

  expandedMonths.value = nextExpandedMonths
}

watch(
  () => props.results,
  () => {
    expandedMonths.value = new Set(monthGroups.value.map(month => month.key))
  },
)
</script>

<template>
  <ol class="border-t border-[var(--ds-divider)]">
    <li
      v-for="month in monthGroups"
      :key="month.key"
      class="border-b border-[var(--ds-divider)]"
    >
      <button
        :aria-controls="month.panelId"
        :aria-expanded="isMonthExpanded(month.key)"
        class="flex min-h-11 w-full items-center justify-between gap-4 py-3 text-left text-sm font-medium text-[var(--ds-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        type="button"
        @click="toggleMonth(month.key)"
      >
        <span>{{ month.label }} · {{ month.results.length }}개</span>
        <span aria-hidden="true" class="text-[var(--ds-muted)]">
          {{ isMonthExpanded(month.key) ? '접기' : '펼치기' }}
        </span>
      </button>

      <ol
        :id="month.panelId"
        :hidden="!isMonthExpanded(month.key)"
        class="border-t border-[var(--ds-divider)]"
      >
        <template v-if="isMonthExpanded(month.key)">
          <li
            v-for="result in month.results"
            :key="result.log.date"
            class="border-b border-[var(--ds-divider)] last:border-b-0"
          >
            <RouterLink
              :to="toDayPath(result.log.date)"
              class="flex min-h-11 gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
            >
              <div class="flex w-28 shrink-0 items-start gap-3">
                <span
                  aria-hidden="true"
                  class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ds-accent)]"
                />
                <div class="space-y-1">
                  <time
                    :datetime="result.log.date"
                    class="block text-sm leading-6 font-medium text-[var(--ds-muted)]"
                  >
                    {{ result.log.date }}
                  </time>
                  <p class="text-sm leading-5 text-[var(--ds-muted)]">
                    {{ formatWeekday(result.log.date) }}
                  </p>
                </div>
              </div>

              <div class="min-w-0 flex-1 space-y-2">
                <p class="flex flex-wrap gap-2 text-sm text-[var(--ds-muted)]">
                  <span
                    v-for="field in result.matchedFields"
                    :key="field"
                    :class="['field-label', FIELD_CLASSES[field]]"
                  >
                    {{ FIELD_LABELS[field] }}
                  </span>
                </p>
                <p class="text-sm leading-6 text-[var(--ds-ink)]">
                  {{ result.excerpt }}
                </p>
              </div>
            </RouterLink>
          </li>
        </template>
      </ol>
    </li>
  </ol>
</template>
