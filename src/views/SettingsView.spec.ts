import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { nextTick, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BackupControls from '../components/BackupControls.vue'
import { createAppRouter } from '../router'

const mockUseAppDailyLogStore = vi.fn()

vi.mock('../app/daily-log-store', () => ({
  useAppDailyLogStore: () => mockUseAppDailyLogStore(),
}))

function createStoreFixture() {
  const store = reactive({
    logs: [],
    isLoading: false,
    error: null as string | null,
    loadAll: vi.fn(async () => undefined),
    exportSnapshot: vi.fn(async () => '{"version":1,"logs":{}}'),
    importSnapshot: vi.fn(async () => undefined),
    clearAll: vi.fn(async () => true),
  })

  return store
}

async function loadSettingsView() {
  const module = await import('./SettingsView.vue')
  return module.default
}

async function mountSettingsView(store = createStoreFixture()) {
  mockUseAppDailyLogStore.mockReturnValue(store)
  const SettingsView = await loadSettingsView()
  const router = createAppRouter(createMemoryHistory())

  await router.push('/settings')
  await router.isReady()

  const wrapper = mount(SettingsView, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()
  return { wrapper, router, store }
}

describe('SettingsView', () => {
  afterEach(() => {
    mockUseAppDailyLogStore.mockReset()
    vi.restoreAllMocks()
  })

  it('loads all logs, renders one main heading, and replaces the settings placeholder route', async () => {
    const store = createStoreFixture()
    const { wrapper, router } = await mountSettingsView(store)
    const SettingsView = await loadSettingsView()

    expect(store.loadAll).toHaveBeenCalledOnce()
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('데이터를 안전하게 보관하세요.')
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(SettingsView)
  })

  it('downloads the store snapshot from the export event', async () => {
    const store = createStoreFixture()
    const createObjectURL = vi.fn(() => 'blob:daystack')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const { wrapper } = await mountSettingsView(store)

    await wrapper.findComponent(BackupControls).get('button').trigger('click')
    await flushPromises()

    expect(store.exportSnapshot).toHaveBeenCalledOnce()
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toMatch(/^daystack-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:daystack')
  })

  it('imports a snapshot and reports success or store errors', async () => {
    const store = createStoreFixture()
    const { wrapper } = await mountSettingsView(store)
    const controls = wrapper.findComponent(BackupControls)

    controls.vm.$emit('import', '{"version":1,"logs":{}}')
    await flushPromises()

    expect(store.importSnapshot).toHaveBeenCalledWith('{"version":1,"logs":{}}')
    expect(wrapper.text()).toContain('데이터를 가져왔습니다.')

    store.error = 'Failed to import snapshot: invalid JSON.'
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('Failed to import snapshot: invalid JSON.')
  })

  it('clears all data only after confirmation', async () => {
    const store = createStoreFixture()
    const { wrapper } = await mountSettingsView(store)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    await wrapper.get('button[data-testid="clear-all"]').trigger('click')
    expect(confirm).toHaveBeenCalledWith('모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')
    expect(store.clearAll).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    await wrapper.get('button[data-testid="clear-all"]').trigger('click')
    expect(store.clearAll).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('모든 기록을 삭제했습니다.')
  })
})
