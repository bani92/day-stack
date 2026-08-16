import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import type { DailyLog } from '../domain/daily-log'
import type { DateKey } from '../domain/date-key'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import { useAppDailyLogStore } from './daily-log-store'
import { appServicesKey, type AppServices } from './services'

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

function createRepository(log: DailyLog): DailyLogRepository {
  return {
    async get(date) {
      return date === log.date ? { ...log } : null
    },
    async list() {
      return [{ ...log }]
    },
    async save(input) {
      return createLog({
        ...input,
        createdAt: log.createdAt,
        updatedAt: '2026-08-16T10:00:00.000Z',
      })
    },
    async remove() {},
    async clear() {},
    async exportSnapshot() {
      return JSON.stringify({ version: 1, logs: { [log.date]: log } })
    },
    async importSnapshot() {},
  }
}

describe('useAppDailyLogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('resolves the provided repository through the app adapter and drives the core store action', async () => {
    const targetLog = createLog({
      date: asDateKey('2026-08-16'),
      done: 'Loaded via app adapter',
      learned: 'provide -> inject -> adapter -> core',
    })
    const services: AppServices = {
      dailyLogRepository: createRepository(targetLog),
    }
    const Host = defineComponent({
      setup() {
        const store = useAppDailyLogStore()
        return { store }
      },
      template: '<div>{{ store.currentLog?.done ?? "" }}</div>',
    })

    const wrapper = mount(Host, {
      global: {
        plugins: [createPinia()],
        provide: {
          [appServicesKey as symbol]: services,
        },
      },
    })

    await wrapper.vm.store.loadDate(asDateKey('2026-08-16'))
    await nextTick()

    expect(wrapper.text()).toContain('Loaded via app adapter')
    expect(wrapper.vm.store.currentLog).toMatchObject({
      date: '2026-08-16',
      learned: 'provide -> inject -> adapter -> core',
    })
  })
})
