import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { createAppRouter } from './index'

describe('createAppRouter', () => {
  it('redirects the root route to today', async () => {
    const router = createAppRouter(createMemoryHistory())

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/today')
  })

  it('redirects an invalid day route param to today', async () => {
    const router = createAppRouter(createMemoryHistory())

    await router.push('/day/not-a-date')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/today')
  })

  it('keeps valid today and day routes intact', async () => {
    const router = createAppRouter(createMemoryHistory())

    await router.push('/today')
    await router.isReady()
    expect(router.currentRoute.value.fullPath).toBe('/today')

    await router.push('/day/2026-08-16')
    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-16')
  })
})
