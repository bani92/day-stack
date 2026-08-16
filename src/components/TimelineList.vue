<script setup lang="ts">
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

function toDayPath(date: DateKey): string {
  return `/day/${date}`
}
</script>

<template>
  <ol class="border-t border-[var(--ds-divider)]">
    <li
      v-for="result in props.results"
      :key="result.log.date"
      class="border-b border-[var(--ds-divider)]"
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
          <time
            :datetime="result.log.date"
            class="text-sm leading-6 font-medium text-[var(--ds-muted)]"
          >
            {{ result.log.date }}
          </time>
        </div>

        <div class="min-w-0 flex-1 space-y-2">
          <p class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--ds-muted)]">
            <span v-for="field in result.matchedFields" :key="field">
              {{ FIELD_LABELS[field] }}
            </span>
          </p>
          <p class="text-sm leading-6 text-[var(--ds-ink)]">
            {{ result.excerpt }}
          </p>
        </div>
      </RouterLink>
    </li>
  </ol>
</template>
