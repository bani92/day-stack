import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import type { DateKey } from '../domain/date-key'
import type { SearchResult } from '../domain/search-logs'

import TimelineList from './TimelineList.vue'

function createSearchResult(
  date: DateKey,
  matchedFields: SearchResult['matchedFields'],
  excerpt: string,
): SearchResult {
  return {
    log: {
      date,
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:30:00.000Z',
      done: '검색 화면 레이아웃 정리',
      learned: '세로 타임라인은 훑어보기가 쉽다',
      blocked: '포커스 링 대비를 더 확인해야 한다',
      next: '결과 비어 있음 상태를 연결한다',
    },
    matchedFields,
    excerpt,
  }
}

async function mountTimelineList(results: SearchResult[]) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/day/:date',
        component: { template: '<div>day</div>' },
      },
    ],
  })

  await router.push('/day/2026-08-16')
  await router.isReady()

  const wrapper = mount(TimelineList, {
    props: {
      results,
    },
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  return wrapper
}

describe('TimelineList', () => {
  it('renders the localized weekday below each date', async () => {
    const wrapper = await mountTimelineList([
      createSearchResult('2026-08-16' as DateKey, ['done'], '검색 화면 레이아웃 정리'),
      createSearchResult('2026-08-15' as DateKey, ['learned'], '세로 타임라인은 훑어보기가 쉽다'),
    ])

    const links = wrapper.findAll('a[href^="/day/"]')

    expect(links).toHaveLength(2)
    expect(links[0]?.find('time').attributes('datetime')).toBe('2026-08-16')
    expect(links[0]?.find('time').text()).toBe('2026-08-16')
    expect(links[0]?.text()).toContain('2026-08-16')
    expect(links[0]?.text()).toContain('일요일')
    expect(links[1]?.find('time').attributes('datetime')).toBe('2026-08-15')
    expect(links[1]?.find('time').text()).toBe('2026-08-15')
    expect(links[1]?.text()).toContain('2026-08-15')
    expect(links[1]?.text()).toContain('토요일')
  })

  it('renders each result with a day link, prompt labels, excerpt, and touch target classes', async () => {
    const wrapper = await mountTimelineList([
      createSearchResult('2026-08-16' as DateKey, ['done', 'next'], '검색 화면 레이아웃 정리'),
      createSearchResult('2026-08-15' as DateKey, ['learned', 'blocked'], '세로 타임라인은 훑어보기가 쉽다'),
    ])

    const links = wrapper.findAll('a[href^="/day/"]')

    expect(links).toHaveLength(2)
    expect(links[0]?.attributes('href')).toBe('/day/2026-08-16')
    expect(links[1]?.attributes('href')).toBe('/day/2026-08-15')
    expect(links[0]?.classes()).toEqual(
      expect.arrayContaining(['min-h-11', 'focus-visible:outline-2', 'focus-visible:outline-offset-2']),
    )
    expect(wrapper.text()).toContain('2026-08-16')
    expect(wrapper.text()).toContain('오늘 한 일')
    expect(wrapper.text()).toContain('다음에 이어갈 일')
    expect(wrapper.text()).toContain('배운 점')
    expect(wrapper.text()).toContain('막힌 점')
    expect(wrapper.text()).toContain('검색 화면 레이아웃 정리')
    expect(wrapper.text()).toContain('세로 타임라인은 훑어보기가 쉽다')
  })
})
