import { describe, expect, it } from 'vitest'
import type { DailyLog } from './daily-log'
import type { DateKey } from './date-key'

function dateKey(value: string): DateKey {
  return value as DateKey
}

function createLog(date: string, fields: Partial<Omit<DailyLog, 'date' | 'createdAt' | 'updatedAt'>> = {}): DailyLog {
  return {
    date: dateKey(date),
    done: '',
    learned: '',
    blocked: '',
    next: '',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
    ...fields,
  }
}

describe('search-logs', () => {
  it('finds case-insensitive partial matches across all searchable fields', async () => {
    const { searchLogs } = await import('./search-logs')
    const logs = [
      createLog('2026-08-12', { next: 'Queue Vue router cleanup' }),
      createLog('2026-08-15', { learned: 'Learned vUe watcher timing' }),
      createLog('2026-08-11', { blocked: 'Blocked by VUE devtools issue' }),
      createLog('2026-08-16', { done: 'Finished vue migration' }),
    ]

    expect(searchLogs(logs, 'Vue')).toEqual([
      expect.objectContaining({
        log: logs[3],
        matchedFields: ['done'],
      }),
      expect.objectContaining({
        log: logs[1],
        matchedFields: ['learned'],
      }),
      expect.objectContaining({
        log: logs[0],
        matchedFields: ['next'],
      }),
      expect.objectContaining({
        log: logs[2],
        matchedFields: ['blocked'],
      }),
    ])
  })

  it('collects matched fields in done, learned, blocked, next order', async () => {
    const { searchLogs } = await import('./search-logs')
    const log = createLog('2026-08-16', {
      done: 'Search indexing shipped',
      learned: 'Search ranking needs trimming',
      blocked: 'Search copy is not final',
      next: 'Search highlighting comes next',
    })

    expect(searchLogs([log], 'search')).toEqual([
      expect.objectContaining({
        log,
        matchedFields: ['done', 'learned', 'blocked', 'next'],
      }),
    ])
  })

  it('returns every log for a blank query in descending date order without mutating the input', async () => {
    const { searchLogs } = await import('./search-logs')
    const logs = [
      createLog('2026-08-12', { done: 'Oldest' }),
      createLog('2026-08-16', { done: 'Newest' }),
      createLog('2026-08-14', { done: 'Middle' }),
    ]
    const originalDates = logs.map(log => log.date)

    const results = searchLogs(logs, '   ')

    expect(results.map(result => result.log.date)).toEqual([
      dateKey('2026-08-16'),
      dateKey('2026-08-14'),
      dateKey('2026-08-12'),
    ])
    expect(logs.map(log => log.date)).toEqual(originalDates)
  })

  it('uses non-empty fields for blank-query metadata and still includes fully blank logs', async () => {
    const { searchLogs } = await import('./search-logs')
    const logs = [
      createLog('2026-08-16', {
        done: '   ',
        learned: '  First visible field  ',
        blocked: '',
        next: 'Second visible field',
      }),
      createLog('2026-08-15', {
        done: ' ',
        learned: '',
        blocked: '   ',
        next: '',
      }),
    ]

    expect(searchLogs(logs, '')).toEqual([
      expect.objectContaining({
        log: logs[0],
        matchedFields: ['learned', 'next'],
        excerpt: 'First visible field',
      }),
      expect.objectContaining({
        log: logs[1],
        matchedFields: [],
        excerpt: '',
      }),
    ])
  })

  it('returns an empty list when nothing matches the query', async () => {
    const { searchLogs } = await import('./search-logs')
    const logs = [
      createLog('2026-08-16', { done: 'Worked on Vue routes' }),
      createLog('2026-08-15', { learned: 'Pinia store hydration' }),
    ]

    expect(searchLogs(logs, 'spring boot')).toEqual([])
  })

  it('trims the first matched field and shortens excerpts longer than 120 characters', async () => {
    const { searchLogs } = await import('./search-logs')
    const trimmedContent = `keyword ${'a'.repeat(130)}`
    const log = createLog('2026-08-16', {
      done: `  ${trimmedContent}  `,
      learned: 'irrelevant',
    })

    expect(searchLogs([log], 'KEYWORD')).toEqual([
      expect.objectContaining({
        log,
        excerpt: `${trimmedContent.slice(0, 120)}…`,
      }),
    ])
  })
})
