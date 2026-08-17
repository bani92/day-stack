import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createDayStackApp } from './main'
import { createAppServices } from './services'

describe('createDayStackApp', () => {
  it('creates services and redirects unauthenticated root access to login', async () => {
    const { router, services } = createDayStackApp({
      history: createMemoryHistory(),
    })

    expect(services.dailyLogRepository).toBeDefined()
    expect(router.getRoutes().map(route => route.name)).toEqual(
      expect.arrayContaining(['today', 'day', 'archive', 'review', 'settings']),
    )

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/today')
  })

  it('creates repository and auth services for app services', () => {
    const first = createAppServices()
    const second = createAppServices()

    expect(first.dailyLogRepository).toBeDefined()
    expect(first.authGateway).toBeDefined()
    expect(second.dailyLogRepository).toBeDefined()
    expect(second.authGateway).toBeDefined()
  })
})
