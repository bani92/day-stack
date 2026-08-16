<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAppDailyLogStore } from '../app/daily-log-store'
import EmptyState from '../components/EmptyState.vue'
import SearchField from '../components/SearchField.vue'
import TimelineList from '../components/TimelineList.vue'
import { searchLogs } from '../domain/search-logs'

const store = useAppDailyLogStore()
const query = ref('')

const results = computed(() => searchLogs(store.logs, query.value))
const hasSavedLogs = computed(() => store.logs.length > 0)
const hasQuery = computed(() => query.value.trim() !== '')
const hasMatches = computed(() => results.value.length > 0)

function clearQuery() {
  query.value = ''
}

onMounted(() => {
  void store.loadAll()
})
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] min-w-0">
    <section class="space-y-6">
      <div class="space-y-3">
        <p class="text-sm font-medium tracking-[0.08em] text-[var(--ds-muted)] uppercase">
          찾기
        </p>
        <h1 class="text-[clamp(1.625rem,2vw+1.1rem,2rem)] font-semibold tracking-tight text-[var(--ds-ink)]">
          {{ hasQuery ? '검색 결과' : '전체 기록' }}
        </h1>
        <p v-if="!hasQuery" class="text-base leading-7 text-[var(--ds-muted)]">
          키워드로 기록을 찾아보세요.
        </p>
      </div>

      <SearchField v-model="query" />

      <p
        v-if="store.error"
        role="alert"
        class="rounded-[8px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] px-4 py-3 text-sm leading-6 text-[var(--ds-ink)]"
      >
        {{ store.error }}
      </p>

      <p
        v-if="store.isLoading"
        class="border-y border-[var(--ds-divider)] py-6 text-sm leading-6 text-[var(--ds-muted)]"
      >
        기록을 불러오는 중입니다.
      </p>

      <section
        v-else-if="!hasSavedLogs"
        class="space-y-4 border-y border-[var(--ds-divider)] py-8 text-center"
      >
        <h2 class="text-lg font-semibold text-[var(--ds-ink)]">아직 기록이 없습니다.</h2>
        <RouterLink
          class="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
          to="/today"
        >
          /today
        </RouterLink>
      </section>

      <TimelineList v-else-if="hasMatches" :results="results" />

      <EmptyState
        v-else
        action-label="전체 기록 보기"
        description="다른 키워드로 다시 찾아보세요."
        title="검색 결과가 없습니다."
        @action="clearQuery"
      />
    </section>
  </main>
</template>
