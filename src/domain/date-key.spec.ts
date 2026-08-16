import { describe, expect, it } from 'vitest'

describe('date-key', () => {
  it('accepts only zero-padded local YYYY-MM-DD strings as DateKey', async () => {
    const { isDateKey } = await import('./date-key')

    expect(isDateKey('2026-08-16')).toBe(true)
    expect(isDateKey('2026-8-16')).toBe(false)
    expect(isDateKey('26-08-16')).toBe(false)
    expect(isDateKey('2026-13-01')).toBe(false)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('20260816')).toBe(false)
  })

  it('creates a local date key without UTC conversion', async () => {
    const { toLocalDateKey } = await import('./date-key')

    const localDate = new Date(2026, 7, 16, 0, 5, 0)

    expect(toLocalDateKey(localDate)).toBe('2026-08-16')
  })
})
