export type DateKey = string & { readonly __brand: 'DateKey' }

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function padNumber(value: number): string {
  return value.toString().padStart(2, '0')
}

export function isDateKey(value: string): boolean {
  const match = DATE_KEY_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const localDate = new Date(year, month - 1, day)

  return (
    localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day
  )
}

export function toLocalDateKey(date: Date): DateKey {
  const year = date.getFullYear()
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())

  return `${year}-${month}-${day}` as DateKey
}
