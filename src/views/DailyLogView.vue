<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAppDailyLogStore } from '../app/daily-log-store'
import { isDateKey, toLocalDateKey, type DateKey } from '../domain/date-key'
import type { DailyLog, DailyLogInput } from '../domain/daily-log'
import DateNavigator from '../components/DateNavigator.vue'
import LogComposer from '../components/LogComposer.vue'
import SaveStatus from '../components/SaveStatus.vue'

const route = useRoute()
const router = useRouter()
const store = useAppDailyLogStore()
const isEditing = ref(false)

function parseDateKey(value: DateKey): Date {
  const [yearText, monthText, dayText] = value.split('-')
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText))
}

function formatHeadingDate(value: DateKey): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseDateKey(value))
}

const resolvedDate = computed<DateKey>(() => {
  if (route.path === '/today') {
    return toLocalDateKey(new Date())
  }

  const dateParam = typeof route.params.date === 'string' ? route.params.date : ''
  return isDateKey(dateParam) ? (dateParam as DateKey) : toLocalDateKey(new Date())
})

const hasCurrentLogForSelectedDate = computed(
  () => store.currentLog !== null && store.currentLog.date === resolvedDate.value,
)

const draftSource = computed<DailyLogInput | null>(() => {
  if (!hasCurrentLogForSelectedDate.value || store.currentLog === null) {
    return null
  }

  return {
    done: store.currentLog.done,
    learned: store.currentLog.learned,
    blocked: store.currentLog.blocked,
    next: store.currentLog.next,
  }
})

const isTodayRoute = computed(() => route.path === '/today')
const isExistingDayRoute = computed(() => !isTodayRoute.value && hasCurrentLogForSelectedDate.value)
const showComposer = computed(
  () => isTodayRoute.value || !hasCurrentLogForSelectedDate.value || isEditing.value,
)
const heading = computed(() =>
  isTodayRoute.value ? '오늘의 기록' : `${formatHeadingDate(resolvedDate.value)} 기록`,
)
const emptyMessage = computed(() =>
  isTodayRoute.value
    ? '한 문장만 남겨도 괜찮습니다.'
    : '이 날에는 기록이 없습니다. 그래도 바로 이어서 적을 수 있습니다.',
)
const introMessage = computed(() =>
  showComposer.value
    ? '오늘을 네 가지 질문으로 남겨보세요.'
    : '남겨둔 흐름을 문서처럼 다시 읽고, 필요할 때 수정하세요.',
)

function getSections(log: DailyLog) {
  return [
    { key: 'done', index: '1.', label: '오늘 한 일', value: log.done },
    { key: 'learned', index: '2.', label: '배운 점', value: log.learned },
    { key: 'blocked', index: '3.', label: '막힌 점', value: log.blocked },
    { key: 'next', index: '4.', label: '다음에 이어갈 일', value: log.next },
  ] as const
}

watch(
  resolvedDate,
  date => {
    isEditing.value = isTodayRoute.value
    void store.loadDate(date)
  },
  { immediate: true },
)

function handleDateChange(date: DateKey) {
  void router.push(`/day/${date}`)
}

function startEditing() {
  isEditing.value = true
}

async function handleSave(input: DailyLogInput) {
  const savedLog = await store.saveCurrent(input)

  if (savedLog !== null && !isTodayRoute.value) {
    isEditing.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] min-w-0">
    <section class="space-y-6">
      <div class="space-y-3">
        <p class="text-sm font-medium tracking-[0.08em] text-[var(--ds-muted)] uppercase">
          기록
        </p>
        <h1 class="text-[clamp(1.625rem,2vw+1.1rem,2rem)] font-semibold tracking-tight text-[var(--ds-ink)]">
          {{ heading }}
        </h1>
        <p class="text-base leading-7 text-[var(--ds-muted)]">
          {{ introMessage }}
        </p>
      </div>

      <DateNavigator :selected-date="resolvedDate" @change="handleDateChange" />

      <section class="space-y-3 border-b border-[var(--ds-divider)] pb-6">
        <p v-if="!store.isLoading && store.currentLog === null" class="text-sm leading-6 text-[var(--ds-muted)]">
          {{ emptyMessage }}
        </p>
        <SaveStatus :error="store.error" :is-saving="store.isSaving" :last-saved-at="store.lastSavedAt" />
      </section>

      <section class="pb-8">
        <article
          v-if="isExistingDayRoute && !showComposer && store.currentLog"
          class="space-y-8"
        >
          <section
            v-for="section in getSections(store.currentLog)"
            :key="section.key"
            class="space-y-3 border-b border-[var(--ds-divider)] pb-6 last:border-b-0"
          >
            <p class="text-sm font-medium text-[var(--ds-muted)]">{{ section.index }}</p>
            <h2 class="text-base font-semibold text-[var(--ds-ink)]">{{ section.label }}</h2>
            <p class="whitespace-pre-wrap text-base leading-7 text-[var(--ds-ink)]">
              {{ section.value || '비워 둔 기록입니다.' }}
            </p>
          </section>

          <div>
            <button
              class="min-h-11 rounded-[8px] border border-[var(--ds-divider)] px-4 py-3 text-sm font-semibold text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)]"
              type="button"
              @click="startEditing"
            >
              수정
            </button>
          </div>
        </article>

        <LogComposer
          v-else
          :initial-value="draftSource"
          :is-saving="store.isSaving"
          @save="handleSave"
        />
      </section>
    </section>
  </main>
</template>
