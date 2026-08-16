import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LogComposer from './LogComposer.vue'

describe('LogComposer', () => {
  it('shows four visible labels and emits the entered daily log when saved', async () => {
    const wrapper = mount(LogComposer)

    const doneField = wrapper.get('#daily-log-done')
    const learnedField = wrapper.get('#daily-log-learned')
    const blockedField = wrapper.get('#daily-log-blocked')
    const nextField = wrapper.get('#daily-log-next')

    expect(wrapper.get('label[for="daily-log-done"]').text()).toContain('오늘 한 일')
    expect(wrapper.get('label[for="daily-log-learned"]').text()).toContain('배운 점')
    expect(wrapper.get('label[for="daily-log-blocked"]').text()).toContain('막힌 점')
    expect(wrapper.get('label[for="daily-log-next"]').text()).toContain('다음에 이어갈 일')

    await doneField.setValue('로그 작성 화면 구현')
    await learnedField.setValue('Store와 View를 분리하면 테스트가 쉬워진다')
    await blockedField.setValue('모바일 내비게이션 간격 조정이 필요하다')
    await nextField.setValue('내일 날짜 이동 상태를 다듬기')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          done: '로그 작성 화면 구현',
          learned: 'Store와 View를 분리하면 테스트가 쉬워진다',
          blocked: '모바일 내비게이션 간격 조정이 필요하다',
          next: '내일 날짜 이동 상태를 다듬기',
        },
      ],
    ])
  })

  it('does not emit save for a completely blank draft and exposes an accessible error state', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const wrapper = mount(LogComposer, {
      attachTo: host,
    })
    const doneField = wrapper.get('#daily-log-done')

    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('한 가지라도 적으면 저장할 수 있습니다.')
    expect(doneField.attributes('aria-invalid')).toBe('true')
    expect(doneField.attributes('aria-describedby')).toBe('daily-log-error')
    expect(document.activeElement).toBe(doneField.element)

    wrapper.unmount()
    host.remove()
  })
})
