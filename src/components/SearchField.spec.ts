import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchField from './SearchField.vue'

describe('SearchField', () => {
  it('renders a labelled search input and emits the entered query', async () => {
    const wrapper = mount(SearchField, {
      props: {
        modelValue: '',
      },
    })

    const input = wrapper.get('#archive-search')
    const label = wrapper.get('label[for="archive-search"]')

    expect(label.text()).toContain('기록 검색')
    expect(input.attributes('type')).toBe('search')
    expect(input.attributes('autocomplete')).toBe('off')

    await input.setValue('타임라인')

    expect(wrapper.emitted('update:modelValue')).toEqual([['타임라인']])
  })

  it('shows a clear action only when the query is non-empty and clears the model value', async () => {
    const emptyWrapper = mount(SearchField, {
      props: {
        modelValue: '',
      },
    })

    expect(emptyWrapper.find('button[type="button"]').exists()).toBe(false)

    const wrapper = mount(SearchField, {
      props: {
        modelValue: '검색어',
      },
    })

    const clearButton = wrapper.get('button[type="button"]')

    expect(clearButton.text()).toContain('지우기')

    await clearButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('shows a clear action for a whitespace-only query and clears the model value', async () => {
    const wrapper = mount(SearchField, {
      props: {
        modelValue: '   ',
      },
    })

    const clearButton = wrapper.get('button[type="button"]')

    expect(clearButton.text()).toContain('지우기')

    await clearButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })
})
