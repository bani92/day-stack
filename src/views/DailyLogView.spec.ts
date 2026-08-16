import { createRouter, createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DailyLog, DailyLogInput } from '../domain/daily-log'
import type { DateKey } from '../domain/date-key'
import DailyLogView from './DailyLogView.vue'

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
  const logsByDate = new Map(initialLogs.map(log => [log.date, { ...log }]))

  const store = reactive({
    selectedDate: null as DateKey | null,
    currentLog: null as DailyLog | null,
    logs: [...initialLogs],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
    lastSavedAt: null as string | null,
    loadDate: vi.fn(async (date: DateKey) => {
      store.selectedDate = date
      store.isLoading = true
      store.error = null
      await Promise.resolve()
      store.currentLog = logsByDate.get(date) ?? null
      store.isLoading = false
    }),
    saveCurrent: vi.fn(async (input: DailyLogInput) => {
      store.isSaving = true
      store.error = null
      await Promise.resolve()

      const savedLog = createLog({
        date: store.selectedDate ?? asDateKey('2026-08-16'),
        ...input,
        updatedAt: '2026-08-16T12:34:00.000Z',
      })
      logsByDate.set(savedLog.date, savedLog)
      store.currentLog = savedLog
      store.lastSavedAt = savedLog.updatedAt
      store.isSaving = false
      return savedLog
    }),
    removeDate: vi.fn(),
    loadAll: vi.fn(),
    importSnapshot: vi.fn(),
  })

  return { store, logsByDate }
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/today',
        component: DailyLogView,
      },
      {
        path: '/day/:date',
        component: DailyLogView,
      },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(DailyLogView, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  return { wrapper, router }
}

function getButtonByText(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'], text: string) {
  const button = wrapper.findAll('button').find(candidate => candidate.text().trim() === text)

  if (!button) {
    throw new Error(`Button not found: ${text}`)
  }

  return button
}

describe('DailyLogView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 16, 9, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    mockUseAppDailyLogStore.mockReset()
  })

  it('loads the local today date and keeps the composer available for a blank day', async () => {
    const { store } = createStoreFixture()
    mockUseAppDailyLogStore.mockReturnValue(store)

    const { wrapper } = await mountAt('/today')

    expect(store.loadDate).toHaveBeenCalledWith(asDateKey('2026-08-16'))
    expect(wrapper.text()).toContain('한 문장만 남겨도 괜찮습니다.')
    expect(wrapper.get('#daily-log-done').element).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('starts in read mode for an existing day log and opens the composer only after edit is requested', async () => {
    const existingLog = createLog({
      date: asDateKey('2026-08-15'),
      done: '어제 한 일 정리',
      learned: '기록을 짧게 써도 충분하다',
      blocked: '오후 집중이 끊겼다',
      next: '아침에 이어서 적기',
    })
    const { store } = createStoreFixture([existingLog])
    mockUseAppDailyLogStore.mockReturnValue(store)

    const { wrapper } = await mountAt('/day/2026-08-15')

    expect(wrapper.find('#daily-log-done').exists()).toBe(false)
    expect(wrapper.text()).toContain('어제 한 일 정리')
    expect(wrapper.text()).toContain('기록을 짧게 써도 충분하다')
    expect(getButtonByText(wrapper, '수정').text()).toContain('수정')

    await getButtonByText(wrapper, '수정').trigger('click')

    expect((wrapper.get('#daily-log-done').element as HTMLTextAreaElement).value).toBe('어제 한 일 정리')
    expect((wrapper.get('#daily-log-next').element as HTMLTextAreaElement).value).toBe('아침에 이어서 적기')
  })

  it('keeps user input visible on save failure after switching an existing log into edit mode', async () => {
    const existingLog = createLog({
      date: asDateKey('2026-08-15'),
      done: '어제 한 일 정리',
      learned: '기록을 짧게 써도 충분하다',
      blocked: '오후 집중이 끊겼다',
      next: '아침에 이어서 적기',
    })
    const { store } = createStoreFixture([existingLog])
    store.saveCurrent = vi.fn(async (_input: DailyLogInput) => {
      store.isSaving = true
      store.error = null
      await Promise.resolve()
      store.error = '저장에 실패했습니다. 다시 저장해 주세요.'
      store.isSaving = false
      return null as unknown as DailyLog
    }) as typeof store.saveCurrent
    mockUseAppDailyLogStore.mockReturnValue(store)

    const { wrapper } = await mountAt('/day/2026-08-15')

    await getButtonByText(wrapper, '수정').trigger('click')

    await wrapper.get('#daily-log-done').setValue('수정한 기록')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(store.saveCurrent).toHaveBeenCalledWith({
      done: '수정한 기록',
      learned: '기록을 짧게 써도 충분하다',
      blocked: '오후 집중이 끊겼다',
      next: '아침에 이어서 적기',
    })
    expect((wrapper.get('#daily-log-done').element as HTMLTextAreaElement).value).toBe('수정한 기록')
    expect(wrapper.find('#daily-log-next').exists()).toBe(true)
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('저장에 실패했습니다. 다시 저장해 주세요.')
  })

  it('returns to read mode after a successful save on an existing day log', async () => {
    const existingLog = createLog({
      date: asDateKey('2026-08-15'),
      done: '어제 한 일 정리',
      learned: '기록을 짧게 써도 충분하다',
      blocked: '오후 집중이 끊겼다',
      next: '아침에 이어서 적기',
    })
    const { store } = createStoreFixture([existingLog])
    mockUseAppDailyLogStore.mockReturnValue(store)

    const { wrapper } = await mountAt('/day/2026-08-15')

    await getButtonByText(wrapper, '수정').trigger('click')
    await wrapper.get('#daily-log-done').setValue('저장 후 문서로 복귀')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(store.saveCurrent).toHaveBeenCalledWith({
      done: '저장 후 문서로 복귀',
      learned: '기록을 짧게 써도 충분하다',
      blocked: '오후 집중이 끊겼다',
      next: '아침에 이어서 적기',
    })
    expect(wrapper.find('#daily-log-done').exists()).toBe(false)
    expect(wrapper.text()).toContain('저장 후 문서로 복귀')
    expect(getButtonByText(wrapper, '수정').exists()).toBe(true)
  })

  it('moves to the previous and next local dates from the navigator', async () => {
    const { store } = createStoreFixture()
    mockUseAppDailyLogStore.mockReturnValue(store)

    const { wrapper, router } = await mountAt('/day/2026-08-16')

    await wrapper.get('button[aria-label="이전 날짜"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-15')
    expect(store.loadDate).toHaveBeenLastCalledWith(asDateKey('2026-08-15'))

    await wrapper.get('button[aria-label="다음 날짜"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-16')
    expect(store.loadDate).toHaveBeenLastCalledWith(asDateKey('2026-08-16'))
  })
})
