import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import type { DailyLog, DailyLogInput } from '../domain/daily-log'
import type { DateKey } from '../domain/date-key'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import { createDailyLogStore } from './daily-log.store'

interface RepositoryFixture {
  calls: {
    get: DateKey[]
    list: number
    save: Array<{
      date: DateKey
      done: string
      learned: string
      blocked: string
      next: string
    }>
    remove: DateKey[]
    importSnapshot: string[]
    clear: number
  }
  repository: DailyLogRepository
}

function asDateKey(value: string): DateKey {
  return value as DateKey
}

function createLog(overrides: Partial<DailyLog> & Pick<DailyLog, 'date'>): DailyLog {
  return {
    date: overrides.date,
    done: overrides.done ?? '',
    learned: overrides.learned ?? '',
    blocked: overrides.blocked ?? '',
    next: overrides.next ?? '',
    createdAt: overrides.createdAt ?? '2026-08-16T09:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-08-16T09:00:00.000Z',
  }
}

function cloneLog(log: DailyLog): DailyLog {
  return { ...log }
}

function cloneNullableLog(log: DailyLog | null): DailyLog | null {
  return log === null ? null : cloneLog(log)
}

function sortLogsDescending(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((left, right) => right.date.localeCompare(left.date))
}

function createRepositoryFixture(options: {
  initialLogs?: DailyLog[]
  get?: (date: DateKey) => Promise<DailyLog | null>
  list?: () => Promise<DailyLog[]>
  save?: (input: DailyLogInput & { date: DateKey }) => Promise<DailyLog>
  remove?: (date: DateKey) => Promise<void>
  importSnapshot?: (serialized: string) => Promise<void>
  clear?: () => Promise<void>
} = {}): RepositoryFixture {
  const logs = new Map((options.initialLogs ?? []).map(log => [log.date, cloneLog(log)]))
  const calls: RepositoryFixture['calls'] = {
    get: [],
    list: 0,
    save: [],
    remove: [],
    importSnapshot: [],
    clear: 0,
  }

  const repository: DailyLogRepository = {
    async get(date) {
      calls.get.push(date)

      if (options.get) {
        return options.get(date)
      }

      return cloneNullableLog(logs.get(date) ?? null)
    },
    async list() {
      calls.list += 1

      if (options.list) {
        return options.list()
      }

      return sortLogsDescending(Array.from(logs.values()).map(cloneLog))
    },
    async save(input) {
      calls.save.push({ ...input })

      if (options.save) {
        return options.save(input)
      }

      const timestamp = `saved-${input.date}`
      const existing = logs.get(input.date)
      const nextLog = createLog({
        ...input,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })
      logs.set(nextLog.date, cloneLog(nextLog))
      return cloneLog(nextLog)
    },
    async remove(date) {
      calls.remove.push(date)

      if (options.remove) {
        return options.remove(date)
      }

      logs.delete(date)
    },
    async exportSnapshot() {
      return JSON.stringify({
        version: 1,
        logs: Object.fromEntries(Array.from(logs.entries())),
      })
    },
    async importSnapshot(serialized) {
      calls.importSnapshot.push(serialized)

      if (options.importSnapshot) {
        return options.importSnapshot(serialized)
      }

      const parsed = JSON.parse(serialized) as { logs: Record<string, DailyLog> }
      logs.clear()

      for (const [date, log] of Object.entries(parsed.logs)) {
        logs.set(asDateKey(date), cloneLog(log))
      }
    },
    async clear() {
      calls.clear += 1

      if (options.clear) {
        return options.clear()
      }

      logs.clear()
    },
  }

  return { calls, repository }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('createDailyLogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads a selected date and keeps loading state until the repository responds', async () => {
    const targetDate = asDateKey('2026-08-16')
    const deferred = createDeferred<DailyLog | null>()
    const { repository } = createRepositoryFixture({
      get: async () => deferred.promise,
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    const loadingPromise = store.loadDate(targetDate)

    expect(store.selectedDate).toBe(targetDate)
    expect(store.isLoading).toBe(true)
    expect(store.error).toBeNull()

    deferred.resolve(
      createLog({
        date: targetDate,
        done: 'Loaded log',
        learned: 'Store state updates after await',
      }),
    )
    await loadingPromise

    expect(store.isLoading).toBe(false)
    expect(store.currentLog).toMatchObject({
      date: '2026-08-16',
      done: 'Loaded log',
      learned: 'Store state updates after await',
    })
  })

  it('saves the selected date, refreshes logs, and records the last saved timestamp', async () => {
    const targetDate = asDateKey('2026-08-16')
    const olderLog = createLog({
      date: asDateKey('2026-08-15'),
      done: 'Yesterday',
      updatedAt: 'saved-2026-08-15',
    })
    const { calls, repository } = createRepositoryFixture({
      initialLogs: [olderLog],
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.saveCurrent({
      done: 'Implemented Task 4',
      learned: 'Pinia store can depend on repository only',
      blocked: '',
      next: 'Wire the view later',
    })

    expect(calls.save).toEqual([
      {
        date: targetDate,
        done: 'Implemented Task 4',
        learned: 'Pinia store can depend on repository only',
        blocked: '',
        next: 'Wire the view later',
      },
    ])
    expect(store.isSaving).toBe(false)
    expect(store.error).toBeNull()
    expect(store.currentLog).toMatchObject({
      date: '2026-08-16',
      done: 'Implemented Task 4',
    })
    expect(store.logs.map(log => log.date)).toEqual(['2026-08-16', '2026-08-15'])
    expect(store.lastSavedAt).toBe('saved-2026-08-16')
  })

  it('preserves existing currentLog and logs when loadDate fails for a new date', async () => {
    const existingDate = asDateKey('2026-08-15')
    const failingDate = asDateKey('2026-08-16')
    const currentLog = createLog({
      date: existingDate,
      done: 'Keep current record visible',
    })
    const siblingLog = createLog({
      date: asDateKey('2026-08-14'),
      done: 'Keep timeline state',
    })
    const { repository } = createRepositoryFixture({
      initialLogs: [currentLog, siblingLog],
      get: async date => {
        if (date === failingDate) {
          throw new Error('get failed')
        }

        if (date === existingDate) {
          return cloneLog(currentLog)
        }

        return cloneNullableLog(null)
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(existingDate)
    await store.loadAll()

    const beforeCurrentLog = cloneLog(store.currentLog as DailyLog)
    const beforeLogs = store.logs.map(cloneLog)

    await store.loadDate(failingDate)

    expect(store.selectedDate).toBe(failingDate)
    expect(store.currentLog).toEqual(beforeCurrentLog)
    expect(store.logs).toEqual(beforeLogs)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('get failed')
  })

  it('rejects save when all four fields are blank after trimming', async () => {
    const targetDate = asDateKey('2026-08-16')
    const { calls, repository } = createRepositoryFixture()
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.saveCurrent({
      done: ' ',
      learned: '',
      blocked: '   ',
      next: '',
    })

    expect(calls.save).toEqual([])
    expect(store.isSaving).toBe(false)
    expect(store.error).toBe('네 필드가 모두 비어 있으면 저장할 수 없습니다.')
    expect(store.currentLog).toBeNull()
    expect(store.lastSavedAt).toBeNull()
  })

  it('surfaces repository save failures and keeps the selected date intact', async () => {
    const targetDate = asDateKey('2026-08-16')
    const { repository } = createRepositoryFixture({
      save: async () => {
        throw new Error('save failed')
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.saveCurrent({
      done: 'Will fail',
      learned: '',
      blocked: '',
      next: '',
    })

    expect(store.selectedDate).toBe(targetDate)
    expect(store.isSaving).toBe(false)
    expect(store.error).toBe('save failed')
    expect(store.currentLog).toBeNull()
    expect(store.lastSavedAt).toBeNull()
  })

  it('loads all logs and clears a stale error on success', async () => {
    const { repository } = createRepositoryFixture({
      initialLogs: [
        createLog({
          date: asDateKey('2026-08-14'),
          done: 'Oldest',
        }),
        createLog({
          date: asDateKey('2026-08-16'),
          done: 'Newest',
        }),
      ],
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    store.error = 'stale error'

    await store.loadAll()

    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.logs.map(log => log.date)).toEqual(['2026-08-16', '2026-08-14'])
  })

  it('removes a date, clears the current log when it matches, and refreshes the list', async () => {
    const targetDate = asDateKey('2026-08-16')
    const { calls, repository } = createRepositoryFixture({
      initialLogs: [
        createLog({
          date: targetDate,
          done: 'Remove me',
        }),
        createLog({
          date: asDateKey('2026-08-15'),
          done: 'Keep me',
        }),
      ],
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.loadAll()
    await store.removeDate(targetDate)

    expect(calls.remove).toEqual([targetDate])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.currentLog).toBeNull()
    expect(store.logs.map(log => log.date)).toEqual(['2026-08-15'])
  })

  it('preserves existing logs and currentLog when removeDate fails', async () => {
    const targetDate = asDateKey('2026-08-16')
    const currentLog = createLog({
      date: targetDate,
      done: 'Keep current log',
    })
    const siblingLog = createLog({
      date: asDateKey('2026-08-15'),
      done: 'Keep sibling log',
    })
    const { repository } = createRepositoryFixture({
      initialLogs: [currentLog, siblingLog],
      remove: async () => {
        throw new Error('remove failed')
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.loadAll()

    const beforeLogs = store.logs.map(cloneLog)
    const beforeCurrentLog = cloneLog(store.currentLog as DailyLog)

    await store.removeDate(targetDate)

    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('remove failed')
    expect(store.currentLog).toEqual(beforeCurrentLog)
    expect(store.logs).toEqual(beforeLogs)
  })

  it('imports a snapshot, reloads logs, and refreshes the selected date entry', async () => {
    const targetDate = asDateKey('2026-08-16')
    const serialized = JSON.stringify({
      version: 1,
      logs: {
        '2026-08-16': createLog({
          date: targetDate,
          done: 'Imported log',
          updatedAt: '2026-08-16T10:30:00.000Z',
        }),
        '2026-08-14': createLog({
          date: asDateKey('2026-08-14'),
          done: 'Older imported log',
        }),
      },
    })
    const { calls, repository } = createRepositoryFixture()
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.importSnapshot(serialized)

    expect(calls.importSnapshot).toEqual([serialized])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.logs.map(log => log.date)).toEqual(['2026-08-16', '2026-08-14'])
    expect(store.currentLog).toMatchObject({
      date: '2026-08-16',
      done: 'Imported log',
    })
  })

  it('preserves existing state when importSnapshot fails', async () => {
    const targetDate = asDateKey('2026-08-16')
    const currentLog = createLog({
      date: targetDate,
      done: 'Keep imported baseline',
    })
    const siblingLog = createLog({
      date: asDateKey('2026-08-15'),
      done: 'Keep archive baseline',
    })
    const { repository } = createRepositoryFixture({
      initialLogs: [currentLog, siblingLog],
      importSnapshot: async () => {
        throw new Error('import failed')
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.loadAll()

    const beforeLogs = store.logs.map(cloneLog)
    const beforeCurrentLog = cloneLog(store.currentLog as DailyLog)

    await store.importSnapshot('{"version":1,"logs":{}}')

    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('import failed')
    expect(store.currentLog).toEqual(beforeCurrentLog)
    expect(store.logs).toEqual(beforeLogs)
  })

  it('exports a snapshot and clears all store state after repository clear succeeds', async () => {
    const targetDate = asDateKey('2026-08-16')
    const { calls, repository } = createRepositoryFixture({
      initialLogs: [createLog({ date: targetDate, done: 'Clear me' })],
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.loadAll()
    const snapshot = await store.exportSnapshot()
    const cleared = await store.clearAll()

    expect(snapshot).toContain('Clear me')
    expect(cleared).toBe(true)
    expect(calls.clear).toBe(1)
    expect(store.logs).toEqual([])
    expect(store.currentLog).toBeNull()
    expect(store.error).toBeNull()
  })

  it('keeps store data when clearAll fails', async () => {
    const targetDate = asDateKey('2026-08-16')
    const existingLog = createLog({ date: targetDate, done: 'Keep me' })
    const { calls, repository } = createRepositoryFixture({
      initialLogs: [existingLog],
      clear: async () => {
        throw new Error('clear failed')
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadDate(targetDate)
    await store.loadAll()
    const cleared = await store.clearAll()

    expect(cleared).toBe(false)
    expect(calls.clear).toBe(1)
    expect(store.logs).toEqual([existingLog])
    expect(store.currentLog).toEqual(existingLog)
    expect(store.error).toBe('clear failed')
  })

  it('clears loading and stores the error when loadAll fails', async () => {
    const { repository } = createRepositoryFixture({
      list: async () => {
        throw new Error('list failed')
      },
    })
    const useStore = createDailyLogStore(repository)
    const store = useStore()

    await store.loadAll()

    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('list failed')
    expect(store.logs).toEqual([])
  })
})
