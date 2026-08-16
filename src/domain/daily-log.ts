import type { DateKey } from './date-key'

export interface DailyLogInput {
  done: string
  learned: string
  blocked: string
  next: string
}

export interface DailyLog extends DailyLogInput {
  date: DateKey
  createdAt: string
  updatedAt: string
}

export function isMeaningfulLog(input: DailyLogInput): boolean {
  return [input.done, input.learned, input.blocked, input.next].some(value => value.trim() !== '')
}
