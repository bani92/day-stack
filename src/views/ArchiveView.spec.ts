import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

async function loadArchiveView() {
  const module = await import('./ArchiveView.vue')
  return module.default
}

async function mountArchiveView(store = createStoreFixture()) {
  mockUseAppDailyLogStore.mockReturnValue(store)

  const ArchiveView = await loadArchiveView()
  const router = createAppRouter(createMemoryHistory())
  await router.push('/archive')
  await router.isReady()

  const wrapper = mount(ArchiveView, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  return { wrapper, router, store }
}

describe('ArchiveView', () => {
  afterEach(() => {
    mockUseAppDailyLogStore.mockReset()
  })

  it('loads all logs on mount and shows the full reverse-chronological timeline for an empty query', async () => {
    const store = createStoreFixture([
      createLog({
        date: asDateKey('2026-08-15'),
        done: '어제 한 일',
      }),
      createLog({
        date: asDateKey('2026-08-16'),
        done: '오늘 한 일',
      }),
    ])

    const { wrapper } = await mountArchiveView(store)

    expect(store.loadAll).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('전체 기록')
    expect(wrapper.text()).toContain('키워드로 기록을 찾아보세요.')
    expect(wrapper.get('a[href="/day/2026-08-16"]').attributes('href')).toBe('/day/2026-08-16')
    expect(wrapper.get('a[href="/day/2026-08-15"]').attributes('href')).toBe('/day/2026-08-15')
  })

  it('filters the timeline as the query changes', async () => {
    const olderLog = createLog({
      date: asDateKey('2026-08-14'),
      done: '문서 정리',
      learned: '짧은 요약도 충분하다',
    })
    const matchingLog = createLog({
      date: asDateKey('2026-08-16'),
      done: 'Vue Router 정리',
      next: 'router 경로 검토',
    })
    const store = createStoreFixture([olderLog, matchingLog])

    const { wrapper } = await mountArchiveView(store)

    await wrapper.get('#archive-search').setValue('router')

    expect(wrapper.text()).toContain('Vue Router')
    expect(wrapper.text()).not.toContain(olderLog.done)
    expect(wrapper.find('a[href="/day/2026-08-16"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/day/2026-08-14"]').exists()).toBe(false)
  })

  it('shows an empty-result state and clears the query through its action', async () => {
    const store = createStoreFixture([
      createLog({
        date: asDateKey('2026-08-16'),
        done: '기록 검색 화면',
      }),
    ])

    const { wrapper } = await mountArchiveView(store)

    await wrapper.get('#archive-search').setValue('없는 키워드')

    expect(wrapper.text()).toContain('검색 결과가 없습니다.')
    await wrapper.get('button').trigger('click')
    expect((wrapper.get('#archive-search').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('전체 기록')
  })

  it('shows the empty archive message with a link to today when there are no saved logs', async () => {
    const { wrapper } = await mountArchiveView(createStoreFixture())

    expect(wrapper.text()).toContain('아직 기록이 없습니다.')
    expect(wrapper.get('a[href="/today"]').text()).toContain('/today')
  })

  it('renders the store error in an alert region and preserves the current query', async () => {
    const store = createStoreFixture([
      createLog({
        date: asDateKey('2026-08-16'),
        done: 'Vue 정리',
      }),
    ])

    const { wrapper } = await mountArchiveView(store)

    await wrapper.get('#archive-search').setValue('Vue')
    store.error = '기록을 불러오지 못했습니다.'
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('기록을 불러오지 못했습니다.')
    expect((wrapper.get('#archive-search').element as HTMLInputElement).value).toBe('Vue')
  })

  it('replaces the archive placeholder route with ArchiveView and keeps result links on /day/YYYY-MM-DD', async () => {
    const store = createStoreFixture([
      createLog({
        date: asDateKey('2026-08-16'),
        done: '라우터 확인',
      }),
    ])
    const ArchiveView = await loadArchiveView()
    const router = createAppRouter(createMemoryHistory())

    mockUseAppDailyLogStore.mockReturnValue(store)
    await router.push('/archive')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('archive')
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(ArchiveView)

    const wrapper = mount(ArchiveView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await wrapper.get('a[href="/day/2026-08-16"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-16')
  })
})
