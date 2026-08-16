import type { DailyLog, DailyLogInput } from '../../domain/daily-log'
import type { DateKey } from '../../domain/date-key'

export interface DailyLogRepository {
  get(date: DateKey): Promise<DailyLog | null>
  list(): Promise<DailyLog[]>
  save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog>
  remove(date: DateKey): Promise<void>
  clear(): Promise<void>
  exportSnapshot(): Promise<string>
  importSnapshot(serialized: string): Promise<void>
}
