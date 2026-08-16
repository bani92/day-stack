import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppRouter } from '../router'
import type { DailyLog } from '../domain/daily-log'
import type { DateKey } from '../domain/date-key'

const mockUseAppDailyLogStore = vi.fn()

vi.mock('../app/daily-log-store', () => ({
  useAppDailyLogStore: () => mockUseAppDailyLogStore(),
}))

function asDateKey(value: string): DateKey {
  return value as DateKey
}

function createLog(overrides: Partial<DailyLog> & Pick<DailyLog, 'date'>): DailyLog {
  return {
    date: overrides.date,
    done: overrides.done ?? '',
    learned: overrides.learned ?? '',
    blocked: overrides.blocked ?? '',
    next: overrides.next ?? '',
    createdAt: overrides.createdAt ?? '2026-08-16T09:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-08-16T09:00:00.000Z',
  }
}

function createStoreFixture(initialLogs: DailyLog[] = []) {
  const store = reactive({
    logs: [...initialLogs],
    isLoading: false,
    error: null as string | null,
    loadAll: vi.fn(async () => {
      store.isLoading = true
      await Promise.resolve()
      store.isLoading = false
    }),
  })

  return store
}

async function mountReviewView(store = createStoreFixture()) {
  mockUseAppDailyLogStore.mockReturnValue(store)

  const router = createAppRouter(createMemoryHistory())
  await router.push('/review')
  await router.isReady()

  const ReviewView = (await import('./ReviewView.vue')).default
  const wrapper = mount(ReviewView, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  return { wrapper, router, store, ReviewView }
}

describe('ReviewView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 16, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    mockUseAppDailyLogStore.mockReset()
  })

  it('loads logs and displays current streak, longest streak, and monthly logged days', async () => {
    const store = createStoreFixture([
      createLog({ date: asDateKey('2026-08-16'), done: '오늘 기록' }),
      createLog({ date: asDateKey('2026-08-15'), learned: '어제 배운 점' }),
      createLog({ date: asDateKey('2026-08-14'), next: '내일 할 일' }),
      createLog({ date: asDateKey('2026-08-10'), done: '긴 흐름 1' }),
      createLog({ date: asDateKey('2026-08-09'), done: '긴 흐름 2' }),
      createLog({ date: asDateKey('2026-08-08'), done: '긴 흐름 3' }),
      createLog({ date: asDateKey('2026-08-07'), done: '긴 흐름 4' }),
      createLog({ date: asDateKey('2026-07-31'), done: '지난달 기록' }),
    ])

    const { wrapper, router, store: mountedStore, ReviewView } = await mountReviewView(store)

    expect(mountedStore.loadAll).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(ReviewView)
    expect(wrapper.text()).toContain('돌아보기')
    expect(wrapper.findAll('dt').map(term => term.text())).toEqual([
      '현재 연속 기록',
      '최장 연속 기록',
      '이번 달 기록일',
    ])
    expect(wrapper.findAll('dd').map(value => value.text())).toEqual(['3일', '4일', '7일'])
    expect(wrapper.text()).toContain('2026년 8월')
  })

  it('shows an empty state with zero statistics when no logs exist', async () => {
    const { wrapper } = await mountReviewView()

    expect(wrapper.text()).toContain('현재 연속 기록')
    expect(wrapper.text()).toContain('최장 연속 기록')
    expect(wrapper.text()).toContain('이번 달 기록일')
    expect(wrapper.text()).toContain('0일')
    expect(wrapper.text()).toContain('아직 기록이 없습니다.')
  })

  it('moves between months and updates the month heading and date list', async () => {
    const store = createStoreFixture([
      createLog({ date: asDateKey('2026-08-16'), done: '8월 기록' }),
      createLog({ date: asDateKey('2026-07-31'), done: '7월 기록' }),
    ])

    const { wrapper } = await mountReviewView(store)

    expect(wrapper.find('a[href="/day/2026-08-16"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/day/2026-07-31"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="이전 달"]').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('2026년 7월')
    expect(wrapper.text()).toContain('2026년 7월 기록일')
    expect(wrapper.find('a[href="/day/2026-07-31"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/day/2026-08-16"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="다음 달"]').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('2026년 8월')
    expect(wrapper.find('a[href="/day/2026-08-16"]').exists()).toBe(true)
  })

  it('renders each logged date as a date link with its weekday', async () => {
    const store = createStoreFixture([
      createLog({ date: asDateKey('2026-08-16'), done: '일요일 기록' }),
      createLog({ date: asDateKey('2026-08-15'), done: '토요일 기록' }),
    ])

    const { wrapper, router } = await mountReviewView(store)

    expect(wrapper.get('a[href="/day/2026-08-16"]').text()).toContain('일요일')
    expect(wrapper.get('a[href="/day/2026-08-15"]').text()).toContain('토요일')

    await wrapper.get('a[href="/day/2026-08-15"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-15')
  })

  it('shows loading and repository error states', async () => {
    const store = createStoreFixture()
    const { wrapper } = await mountReviewView(store)

    store.isLoading = true
    await nextTick()
    expect(wrapper.text()).toContain('기록을 불러오는 중입니다.')

    store.isLoading = false
    store.error = '기록을 불러오지 못했습니다.'
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('기록을 불러오지 못했습니다.')
    await wrapper.get('button').trigger('click')
    expect(store.loadAll).toHaveBeenCalledTimes(2)
  })
})
