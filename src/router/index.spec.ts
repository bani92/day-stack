import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { createAppRouter } from './index'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import type { AuthGateway } from '../infrastructure/auth/auth-gateway'

function createAuthGateway(isAuthenticated: boolean): AuthGateway {
  return {
    async getCurrentUser() {
      return isAuthenticated ? { id: 'user-1', email: 'owner@example.com' } : null
    },
    async signIn() {},
  }
}

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

  it('maps settings to SettingsView', () => {
    const router = createAppRouter(createMemoryHistory())

    expect(router.getRoutes().find(route => route.name === 'settings')?.components?.default).toBe(SettingsView)
  })

  it('redirects unauthenticated users to login with their intended path', async () => {
    const router = createAppRouter(createMemoryHistory(), {
      authGateway: createAuthGateway(false),
    })

    await router.push('/archive')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/archive')
  })

  it('allows an authenticated user to enter protected routes', async () => {
    const router = createAppRouter(createMemoryHistory(), {
      authGateway: createAuthGateway(true),
    })

    await router.push('/archive')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/archive')
  })

  it('keeps the login route public and maps it to LoginView', () => {
    const router = createAppRouter(createMemoryHistory())

    expect(router.getRoutes().find(route => route.name === 'login')?.components?.default).toBe(LoginView)
  })
})
