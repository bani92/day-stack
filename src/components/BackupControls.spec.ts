import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BackupControls from './BackupControls.vue'

describe('BackupControls', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits export when the JSON export button is clicked', async () => {
    const wrapper = mount(BackupControls)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('export')).toEqual([[]])
  })

  it('opens the file picker from a keyboard-focusable import button', async () => {
    const wrapper = mount(BackupControls)
    const input = wrapper.get('input[type="file"]')
    const click = vi.spyOn(input.element as HTMLInputElement, 'click')
    const importButton = wrapper.get('button[data-testid="import-trigger"]')

    expect(importButton.classes()).toContain('focus-visible:outline-2')

    await importButton.trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('reads a selected JSON file and emits its serialized contents', async () => {
    const serialized = '{"version":1,"logs":{}}'
    const readAsText = vi.fn(function (this: FileReaderHarness, file: File) {
      queueMicrotask(() => {
        this.result = serialized
        this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
      })
      expect(file.name).toBe('daystack-backup.json')
    })

    class MockFileReader {
      result: string | null = null
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null
      onerror: (() => void) | null = null
      readAsText = readAsText
    }

    vi.stubGlobal('FileReader', MockFileReader)
    const wrapper = mount(BackupControls)
    const file = new File([serialized], 'daystack-backup.json', {
      type: 'application/json',
    })
    const input = wrapper.get('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.emitted('import')).toEqual([[serialized]])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows a file read error without emitting import', async () => {
    class FailingFileReader {
      result: string | null = null
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null
      onerror: (() => void) | null = null
      readAsText = vi.fn(() => {
        queueMicrotask(() => this.onerror?.())
      })
    }

    vi.stubGlobal('FileReader', FailingFileReader)
    const wrapper = mount(BackupControls)
    const file = new File(['broken'], 'broken.json', { type: 'application/json' })
    const input = wrapper.get('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('파일을 읽지 못했습니다.')
    expect(wrapper.emitted('import')).toBeUndefined()
  })
})

type FileReaderHarness = {
  result: string | null
  onload: ((event: ProgressEvent<FileReader>) => void) | null
  onerror: (() => void) | null
}
