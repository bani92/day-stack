import { toLocalDateKey, type DateKey } from './date-key'

function toLocalCalendarDate(dateKey: DateKey): Date {
  const [yearText, monthText, dayText] = dateKey.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function shiftDateKey(dateKey: DateKey, days: number): DateKey {
  const date = toLocalCalendarDate(dateKey)
  date.setDate(date.getDate() + days)
  return toLocalDateKey(date)
}

function uniqueSortedDateKeys(logDates: DateKey[]): DateKey[] {
  return [...new Set(logDates)].sort()
}

export function calculateCurrentStreak(logDates: DateKey[], today: DateKey): number {
  const uniqueDates = new Set(uniqueSortedDateKeys(logDates))
  let cursor = uniqueDates.has(today) ? today : shiftDateKey(today, -1)

  if (!uniqueDates.has(cursor)) {
    return 0
  }

  let streak = 0

  while (uniqueDates.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }

  return streak
}

export function calculateLongestStreak(logDates: DateKey[]): number {
  const uniqueDates = uniqueSortedDateKeys(logDates)

  if (uniqueDates.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = uniqueDates[index - 1]
    const expected = shiftDateKey(previous, 1)

    if (uniqueDates[index] === expected) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }

    current = 1
  }

  return longest
}

export function countLogsInMonth(logDates: DateKey[], month: string): number {
  const monthPrefix = `${month}-`

  return uniqueSortedDateKeys(logDates).filter(dateKey => dateKey.startsWith(monthPrefix)).length
}
