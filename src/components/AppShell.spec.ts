import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

import AppShell from './AppShell.vue'

async function mountAppShell(initialPath = '/today') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/today',
        component: { template: '<div>today</div>' },
      },
      {
        path: '/day/:date',
        component: { template: '<div>day</div>' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  return mount(AppShell, {
    slots: {
      default: '<main>content</main>',
    },
    global: {
      plugins: [router],
      stubs: {
        DesktopNav: {
          template: '<nav aria-label="desktop"></nav>',
        },
        MobileNav: {
          template: '<nav aria-label="mobile"></nav>',
        },
      },
    },
  })
}

describe('AppShell', () => {
  it('renders the home brand link with an accessible touch target class set', async () => {
    const wrapper = await mountAppShell()

    const brandLink = wrapper.get('a[href="/today"]')

    expect(brandLink.text()).toContain('DayStack')
    expect(brandLink.classes()).toEqual(
      expect.arrayContaining(['inline-flex', 'min-h-11', 'items-center', 'px-2', 'py-2']),
    )
  })

  it('navigates back to today when the home brand link is clicked from a day route', async () => {
    const wrapper = await mountAppShell('/day/2026-08-16')
    const brandLink = wrapper.get('a[href="/today"]')
    const router = wrapper.vm.$router

    expect(router.currentRoute.value.fullPath).toBe('/day/2026-08-16')

    await brandLink.trigger('click', { button: 0 })
    await nextTick()
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/today')
  })
})
