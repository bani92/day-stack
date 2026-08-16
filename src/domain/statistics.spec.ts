import { describe, expect, it } from 'vitest'
import type { DateKey } from './date-key'

function dateKey(value: string): DateKey {
  return value as DateKey
}

describe('statistics', () => {
  it('calculates the current streak ending today when today is logged', async () => {
    const { calculateCurrentStreak } = await import('./statistics')

    expect(
      calculateCurrentStreak(
        [dateKey('2026-08-14'), dateKey('2026-08-15'), dateKey('2026-08-16')],
        dateKey('2026-08-16'),
      ),
    ).toBe(3)
  })

  it('calculates the current streak from yesterday when today is not logged', async () => {
    const { calculateCurrentStreak } = await import('./statistics')

    expect(
      calculateCurrentStreak(
        [dateKey('2026-08-13'), dateKey('2026-08-14'), dateKey('2026-08-15')],
        dateKey('2026-08-16'),
      ),
    ).toBe(3)
  })

  it('returns zero current streak when neither today nor yesterday is logged', async () => {
    const { calculateCurrentStreak } = await import('./statistics')

    expect(
      calculateCurrentStreak(
        [dateKey('2026-08-12'), dateKey('2026-08-13'), dateKey('2026-08-14')],
        dateKey('2026-08-16'),
      ),
    ).toBe(0)
  })

  it('deduplicates dates and keeps streaks across month boundaries', async () => {
    const { calculateCurrentStreak, calculateLongestStreak } = await import('./statistics')

    const logDates = [
      dateKey('2026-01-31'),
      dateKey('2026-02-01'),
      dateKey('2026-02-01'),
      dateKey('2026-02-02'),
    ]

    expect(calculateCurrentStreak(logDates, dateKey('2026-02-02'))).toBe(3)
    expect(calculateLongestStreak(logDates)).toBe(3)
  })

  it('finds the longest streak when there is a gap in the middle', async () => {
    const { calculateLongestStreak } = await import('./statistics')

    expect(
      calculateLongestStreak([
        dateKey('2026-08-01'),
        dateKey('2026-08-02'),
        dateKey('2026-08-04'),
        dateKey('2026-08-05'),
        dateKey('2026-08-06'),
      ]),
    ).toBe(3)
  })

  it('counts logs in a month by unique date key prefix', async () => {
    const { countLogsInMonth } = await import('./statistics')

    expect(
      countLogsInMonth(
        [
          dateKey('2026-02-01'),
          dateKey('2026-02-01'),
          dateKey('2026-02-15'),
          dateKey('2026-03-01'),
        ],
        '2026-02',
      ),
    ).toBe(2)
  })
})
