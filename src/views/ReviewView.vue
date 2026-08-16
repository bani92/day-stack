<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useAppDailyLogStore } from '../app/daily-log-store'
import { toLocalDateKey, type DateKey } from '../domain/date-key'
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  countLogsInMonth,
} from '../domain/statistics'
import MonthOverview from '../components/MonthOverview.vue'
import StreakSummary from '../components/StreakSummary.vue'

const store = useAppDailyLogStore()

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + amount, 1)

  return toMonthKey(date)
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)

  return `${year}년 ${monthNumber}월`
}

function uniqueDates(dates: DateKey[]): DateKey[] {
  return [...new Set(dates)].sort((left, right) => right.localeCompare(left))
}

const today = toLocalDateKey(new Date())
const currentMonth = toMonthKey(new Date())
const selectedMonth = ref(toMonthKey(new Date()))
const logDates = computed(() => store.logs.map(log => log.date))
const selectedMonthDates = computed(() =>
  uniqueDates(
    logDates.value.filter(date => date.startsWith(`${selectedMonth.value}-`)),
  ),
)
const currentStreak = computed(() => calculateCurrentStreak(logDates.value, today))
const longestStreak = computed(() => calculateLongestStreak(logDates.value))
const monthlyLoggedDays = computed(() =>
  countLogsInMonth(logDates.value, selectedMonth.value),
)
const monthlyLoggedDaysLabel = computed(() =>
  selectedMonth.value === currentMonth
    ? '이번 달 기록일'
    : `${formatMonth(selectedMonth.value)} 기록일`,
)

function moveMonth(amount: number) {
  selectedMonth.value = shiftMonth(selectedMonth.value, amount)
}

function retryLoadAll() {
  void store.loadAll()
}

onMounted(() => {
  void store.loadAll()
})
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] min-w-0">
    <section class="space-y-8">
      <header class="space-y-3">
        <p class="text-sm font-medium tracking-[0.08em] text-[var(--ds-muted)] uppercase">
          돌아보기
        </p>
        <h1 class="text-[clamp(1.625rem,2vw+1.1rem,2rem)] font-semibold tracking-tight text-[var(--ds-ink)]">
          기록의 흐름을 돌아보세요.
        </h1>
        <p class="text-base leading-7 text-[var(--ds-muted)]">
          짧게 남긴 기록도 이어서 보면 나만의 흐름이 됩니다.
        </p>
      </header>

      <StreakSummary
        :current-streak="currentStreak"
        :longest-streak="longestStreak"
        :monthly-logged-days="monthlyLoggedDays"
        :monthly-logged-days-label="monthlyLoggedDaysLabel"
      />

      <section
        v-if="store.error"
        class="space-y-3 border-y border-[var(--ds-divider)] py-6"
      >
        <p role="alert" class="text-sm leading-6 text-[var(--ds-ink)]">
          {{ store.error }}
        </p>
        <button
          class="inline-flex min-h-11 items-center rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
          type="button"
          @click="retryLoadAll"
        >
          다시 불러오기
        </button>
      </section>

      <p
        v-else-if="store.isLoading"
        class="border-y border-[var(--ds-divider)] py-6 text-sm leading-6 text-[var(--ds-muted)]"
      >
        기록을 불러오는 중입니다.
      </p>

      <section v-else class="space-y-6">
        <div class="flex items-center justify-between gap-3 border-y border-[var(--ds-divider)] py-3">
          <button
            aria-label="이전 달"
            class="inline-flex min-h-11 items-center rounded-[8px] px-3 py-2 text-sm font-medium text-[var(--ds-ink)] hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
            type="button"
            @click="moveMonth(-1)"
          >
            이전 달
          </button>
          <h2 class="text-base font-semibold text-[var(--ds-ink)]">{{ formatMonth(selectedMonth) }}</h2>
          <button
            aria-label="다음 달"
            class="inline-flex min-h-11 items-center rounded-[8px] px-3 py-2 text-sm font-medium text-[var(--ds-ink)] hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
            type="button"
            @click="moveMonth(1)"
          >
            다음 달
          </button>
        </div>

        <MonthOverview
          :dates="selectedMonthDates"
          :no-saved-logs="store.logs.length === 0"
        />
      </section>
    </section>
  </main>
</template>
