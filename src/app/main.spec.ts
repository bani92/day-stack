import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createDayStackApp } from './main'
import { createAppServices } from './services'
import { LocalStorageDailyLogRepository } from '../infrastructure/repositories/local-storage-daily-log-repository'

describe('createDayStackApp', () => {
  it('creates services and redirects the root route to today', async () => {
    const { router, services } = createDayStackApp({
      history: createMemoryHistory(),
    })

    expect(services.dailyLogRepository).toBeDefined()
    expect(router.getRoutes().map(route => route.name)).toEqual(
      expect.arrayContaining(['today', 'day', 'archive', 'review', 'settings']),
    )

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/today')
  })

  it('creates a real local storage repository for app services', () => {
    const first = createAppServices()
    const second = createAppServices()

    expect(first.dailyLogRepository).toBeInstanceOf(LocalStorageDailyLogRepository)
    expect(second.dailyLogRepository).toBeInstanceOf(LocalStorageDailyLogRepository)
    expect(first.dailyLogRepository).not.toBe(second.dailyLogRepository)
  })
})
