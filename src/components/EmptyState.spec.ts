import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('renders title and description, and emits action when its optional button is activated', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '아직 검색 결과가 없습니다.',
        description: '다른 검색어로 다시 찾아보세요.',
        actionLabel: '오늘 기록 보러 가기',
      },
    })

    expect(wrapper.text()).toContain('아직 검색 결과가 없습니다.')
    expect(wrapper.text()).toContain('다른 검색어로 다시 찾아보세요.')

    await wrapper.get('button[type="button"]').trigger('click')

    expect(wrapper.emitted('action')).toEqual([[]])
  })

  it('does not render an action button when actionLabel is omitted', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '기록이 비어 있습니다.',
        description: '오늘 첫 기록을 남겨보세요.',
      },
    })

    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })
})
