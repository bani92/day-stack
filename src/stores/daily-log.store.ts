import { defineStore } from 'pinia'

import { isMeaningfulLog, type DailyLog, type DailyLogInput } from '../domain/daily-log'
import type { DateKey } from '../domain/date-key'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'

const EMPTY_LOG_ERROR = '네 필드가 모두 비어 있으면 저장할 수 없습니다.'

function sortLogsDescending(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((left, right) => right.date.localeCompare(left.date))
}

function normalizeLogInput(input: DailyLogInput): DailyLogInput {
  return {
    done: input.done.trim(),
    learned: input.learned.trim(),
    blocked: input.blocked.trim(),
    next: input.next.trim(),
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
}

function upsertLog(logs: DailyLog[], nextLog: DailyLog): DailyLog[] {
  const filtered = logs.filter(log => log.date !== nextLog.date)
  return sortLogsDescending([...filtered, nextLog])
}

function removeLog(logs: DailyLog[], date: DateKey): DailyLog[] {
  return logs.filter(log => log.date !== date)
}

export function createDailyLogStore(repository: DailyLogRepository) {
  return defineStore(`daily-log:${Math.random().toString(36).slice(2)}`, {
    state: () => ({
      selectedDate: null as DateKey | null,
      currentLog: null as DailyLog | null,
      logs: [] as DailyLog[],
      isLoading: false,
      isSaving: false,
      error: null as string | null,
      lastSavedAt: null as string | null,
    }),
    actions: {
      async loadDate(date: DateKey) {
        this.selectedDate = date
        this.isLoading = true
        this.error = null

        try {
          const log = await repository.get(date)
          this.currentLog = log

          if (log !== null) {
            this.logs = upsertLog(this.logs, log)
          } else {
            this.logs = removeLog(this.logs, date)
          }
        } catch (error) {
          this.error = toErrorMessage(error)
        } finally {
          this.isLoading = false
        }
      },

      async saveCurrent(input: DailyLogInput) {
        this.isSaving = true
        this.error = null

        try {
          if (this.selectedDate === null) {
            throw new Error('저장할 날짜를 먼저 선택하세요.')
          }

          const normalizedInput = normalizeLogInput(input)

          if (!isMeaningfulLog(normalizedInput)) {
            this.error = EMPTY_LOG_ERROR
            return null
          }

          const savedLog = await repository.save({
            date: this.selectedDate,
            ...normalizedInput,
          })

          this.currentLog = savedLog
          this.logs = sortLogsDescending(await repository.list())
          this.lastSavedAt = savedLog.updatedAt

          return savedLog
        } catch (error) {
          this.error = toErrorMessage(error)
          return null
        } finally {
          this.isSaving = false
        }
      },

      async removeDate(date: DateKey) {
        this.isLoading = true
        this.error = null

        try {
          await repository.remove(date)
          this.logs = removeLog(this.logs, date)

          if (this.selectedDate === date) {
            this.currentLog = null
          }
        } catch (error) {
          this.error = toErrorMessage(error)
        } finally {
          this.isLoading = false
        }
      },

      async loadAll() {
        this.isLoading = true
        this.error = null

        try {
          this.logs = sortLogsDescending(await repository.list())
        } catch (error) {
          this.error = toErrorMessage(error)
        } finally {
          this.isLoading = false
        }
      },

      async importSnapshot(serialized: string) {
        this.isLoading = true
        this.error = null

        try {
          await repository.importSnapshot(serialized)
          this.logs = sortLogsDescending(await repository.list())

          if (this.selectedDate !== null) {
            this.currentLog = await repository.get(this.selectedDate)
          }
        } catch (error) {
          this.error = toErrorMessage(error)
        } finally {
          this.isLoading = false
        }
      },

      async exportSnapshot(): Promise<string | null> {
        this.isLoading = true
        this.error = null

        try {
          return await repository.exportSnapshot()
        } catch (error) {
          this.error = toErrorMessage(error)
          return null
        } finally {
          this.isLoading = false
        }
      },

      async clearAll(): Promise<boolean> {
        this.isLoading = true
        this.error = null

        try {
          await repository.clear()
          this.logs = []
          this.currentLog = null
          this.lastSavedAt = null
          return true
        } catch (error) {
          this.error = toErrorMessage(error)
          return false
        } finally {
          this.isLoading = false
        }
      },
    },
  })
}
