import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import type { AppServices } from '../app/services'
import { appServicesKey } from '../app/services'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import LoginView from './LoginView.vue'

function createServices(signIn: AppServices['authGateway']['signIn']): AppServices {
  return {
    dailyLogRepository: {} as DailyLogRepository,
    authGateway: {
      getCurrentUser: vi.fn(async () => null),
      signIn,
    },
  }
}

async function mountLogin(signIn: AppServices['authGateway']['signIn']) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/archive', name: 'archive', component: { template: '<div />' } },
      { path: '/today', name: 'today', component: { template: '<div />' } },
    ],
  })
  await router.push('/login?redirect=/archive')
  await router.isReady()

  const wrapper = mount(LoginView, {
    global: {
      plugins: [router],
      provide: {
        [appServicesKey as symbol]: createServices(signIn),
      },
    },
  })

  return { wrapper, router }
}

describe('LoginView', () => {
  it('submits only the invited account credentials and redirects to the requested path', async () => {
    const signIn = vi.fn(async () => undefined)
    const { wrapper, router } = await mountLogin(signIn)

    await wrapper.get('#login-email').setValue('owner@example.com')
    await wrapper.get('#login-password').setValue('password')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(signIn).toHaveBeenCalledWith('owner@example.com', 'password')
    expect(router.currentRoute.value.fullPath).toBe('/archive')
    expect(wrapper.text()).not.toContain('회원가입')
    expect(wrapper.text()).not.toContain('로그아웃')
  })

  it('shows the authentication error without adding extra account flows', async () => {
    const signIn = vi.fn(async () => {
      throw new Error('초대된 계정만 로그인할 수 있습니다.')
    })
    const { wrapper } = await mountLogin(signIn)

    await wrapper.get('#login-email').setValue('unknown@example.com')
    await wrapper.get('#login-password').setValue('password')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('초대된 계정만 로그인할 수 있습니다.')
  })
})
