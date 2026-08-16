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

  it('applies a distinct visual class to each matched prompt label', async () => {
    const wrapper = await mountTimelineList([
      createSearchResult('2026-08-16' as DateKey, ['done', 'learned', 'blocked', 'next'], '오늘의 기록'),
    ])

    expect(wrapper.find('.field-label--done').text()).toBe('오늘 한 일')
    expect(wrapper.find('.field-label--learned').text()).toBe('배운 점')
    expect(wrapper.find('.field-label--blocked').text()).toBe('막힌 점')
    expect(wrapper.find('.field-label--next').text()).toBe('다음에 이어갈 일')
  })

  it('groups results by month, expands the latest month, and omits collapsed links from the DOM', async () => {
    const wrapper = await mountTimelineList([
      createSearchResult('2026-08-16' as DateKey, ['done'], '8월 기록 1'),
      createSearchResult('2026-08-15' as DateKey, ['learned'], '8월 기록 2'),
      createSearchResult('2026-07-31' as DateKey, ['next'], '7월 기록'),
    ])

    const monthButtons = wrapper.findAll('button[aria-controls]')

    expect(monthButtons).toHaveLength(2)
    expect(monthButtons[0]?.text()).toContain('2026년 8월 · 2개')
    expect(monthButtons[1]?.text()).toContain('2026년 7월 · 1개')
    expect(monthButtons[0]?.attributes('aria-expanded')).toBe('true')
    expect(monthButtons[1]?.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#timeline-month-2026-08').findAll('a[href^="/day/"]')).toHaveLength(2)
    expect(wrapper.find('#timeline-month-2026-07').exists()).toBe(false)
  })

  it('toggles a month button and reveals that month’s date links', async () => {
    const wrapper = await mountTimelineList([
      createSearchResult('2026-08-16' as DateKey, ['done'], '8월 기록'),
      createSearchResult('2026-07-31' as DateKey, ['next'], '7월 기록'),
    ])

    const olderMonthButton = wrapper.findAll('button[aria-controls]')[1]
    await olderMonthButton?.trigger('click')

    expect(olderMonthButton?.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#timeline-month-2026-07').find('a[href="/day/2026-07-31"]').exists()).toBe(true)
  })

  it('expands every month when the search results change', async () => {
    const augustResults = [
      createSearchResult('2026-08-16' as DateKey, ['done'], '8월 기록'),
    ]
    const wrapper = await mountTimelineList(augustResults)

    await wrapper.setProps({
      results: [
        ...augustResults,
        createSearchResult('2026-07-31' as DateKey, ['next'], '7월 검색 결과'),
      ],
    })

    const monthButtons = wrapper.findAll('button[aria-controls]')

    expect(monthButtons[0]?.attributes('aria-expanded')).toBe('true')
    expect(monthButtons[1]?.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#timeline-month-2026-07').find('a[href="/day/2026-07-31"]').exists()).toBe(true)
  })
})
