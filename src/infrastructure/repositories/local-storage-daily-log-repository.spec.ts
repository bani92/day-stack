import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DailyLog, DailyLogInput } from '../../domain/daily-log'
import type { DateKey } from '../../domain/date-key'

const STORAGE_KEY = 'daystack:data'

interface RepositoryFixture {
  repository: {
    get(date: DateKey): Promise<DailyLog | null>
    list(): Promise<DailyLog[]>
    save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog>
    remove(date: DateKey): Promise<void>
    exportSnapshot(): Promise<string>
    importSnapshot(serialized: string): Promise<void>
  }
  storage: {
    get<T>(key: string): T | null
    set<T>(key: string, value: T): void
    remove(key: string): void
  }
}

function createFakeStorage(initialEntries: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initialEntries))

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

async function createRepositoryFixture(existingStorage?: RepositoryFixture['storage']): Promise<RepositoryFixture> {
  const [{ LocalStorageDailyLogRepository }, { MemoryStorage }] = await Promise.all([
    import('./local-storage-daily-log-repository'),
    import('../storage/memory-storage'),
  ])

  const storage = existingStorage ?? new MemoryStorage()
  const repository = new LocalStorageDailyLogRepository(storage)

  return { repository, storage }
}

function asDateKey(value: string): DateKey {
  return value as DateKey
}

describe('LocalStorageDailyLogRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws when BrowserLocalStorage reads invalid JSON from an injected Storage boundary', async () => {
    const { BrowserLocalStorage } = await import('../storage/browser-local-storage')
    const storage = new BrowserLocalStorage(
      createFakeStorage({
        [STORAGE_KEY]: '{invalid-json}',
      }),
    )

    expect(() => storage.get(STORAGE_KEY)).toThrow(SyntaxError)
  })

  it('saves a meaningful log and loads it by date', async () => {
    vi.setSystemTime(new Date('2026-08-16T09:00:00.000Z'))

    const { repository } = await createRepositoryFixture()
    const saved = await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Implemented repository storage',
      learned: 'TDD flow for infra layer',
      blocked: '',
      next: 'Wire the store',
    })

    expect(saved).toEqual({
      date: '2026-08-16',
      done: 'Implemented repository storage',
      learned: 'TDD flow for infra layer',
      blocked: '',
      next: 'Wire the store',
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:00:00.000Z',
    })

    await expect(repository.get(asDateKey('2026-08-16'))).resolves.toEqual(saved)
  })

  it('keeps createdAt and refreshes updatedAt when saving the same date again', async () => {
    const { repository } = await createRepositoryFixture()

    vi.setSystemTime(new Date('2026-08-16T09:00:00.000Z'))
    const first = await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'First draft',
      learned: '',
      blocked: '',
      next: '',
    })

    vi.setSystemTime(new Date('2026-08-16T10:30:00.000Z'))
    const updated = await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Second draft',
      learned: 'Kept repository API stable',
      blocked: '',
      next: '',
    })

    expect(updated.createdAt).toBe(first.createdAt)
    expect(updated.updatedAt).toBe('2026-08-16T10:30:00.000Z')
    expect(updated.done).toBe('Second draft')
    expect(updated.learned).toBe('Kept repository API stable')
  })

  it('removes a saved log', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Saved once',
      learned: '',
      blocked: '',
      next: '',
    })

    await repository.remove(asDateKey('2026-08-16'))

    await expect(repository.get(asDateKey('2026-08-16'))).resolves.toBeNull()
    await expect(repository.list()).resolves.toEqual([])
  })

  it('lists logs in descending date order', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-14'),
      done: 'Oldest',
      learned: '',
      blocked: '',
      next: '',
    })
    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Newest',
      learned: '',
      blocked: '',
      next: '',
    })
    await repository.save({
      date: asDateKey('2026-08-15'),
      done: 'Middle',
      learned: '',
      blocked: '',
      next: '',
    })

    await expect(repository.list()).resolves.toMatchObject([
      { date: '2026-08-16', done: 'Newest' },
      { date: '2026-08-15', done: 'Middle' },
      { date: '2026-08-14', done: 'Oldest' },
    ])
  })

  it('reloads persisted data from the same storage instance', async () => {
    const initial = await createRepositoryFixture()

    await initial.repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Persists in storage',
      learned: '',
      blocked: '',
      next: '',
    })

    const reloaded = await createRepositoryFixture(initial.storage)

    await expect(reloaded.repository.get(asDateKey('2026-08-16'))).resolves.toMatchObject({
      date: '2026-08-16',
      done: 'Persists in storage',
    })
  })

  it('rejects saving a log when all fields are blank', async () => {
    const { repository } = await createRepositoryFixture()

    await expect(
      repository.save({
        date: asDateKey('2026-08-16'),
        done: ' ',
        learned: '',
        blocked: '   ',
        next: '',
      }),
    ).rejects.toThrow('Cannot save an empty daily log.')
  })

  it('exports the current version 1 snapshot as JSON', async () => {
    vi.setSystemTime(new Date('2026-08-16T09:00:00.000Z'))

    const { repository, storage } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Backup ready',
      learned: '',
      blocked: '',
      next: '',
    })

    await expect(repository.exportSnapshot()).resolves.toBe(
      JSON.stringify(storage.get(STORAGE_KEY)),
    )
    await expect(repository.exportSnapshot()).resolves.toContain('"version":1')
  })

  it('imports a valid snapshot after validating its structure', async () => {
    const { repository } = await createRepositoryFixture()

    const serialized = JSON.stringify({
      version: 1,
      logs: {
        '2026-08-16': {
          date: '2026-08-16',
          done: 'Imported done',
          learned: 'Imported learned',
          blocked: '',
          next: '',
          createdAt: '2026-08-16T09:00:00.000Z',
          updatedAt: '2026-08-16T09:15:00.000Z',
        },
      },
    })

    await repository.importSnapshot(serialized)

    await expect(repository.get(asDateKey('2026-08-16'))).resolves.toEqual({
      date: '2026-08-16',
      done: 'Imported done',
      learned: 'Imported learned',
      blocked: '',
      next: '',
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:15:00.000Z',
    })
  })

  it('preserves the existing snapshot when import JSON is invalid', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Keep me',
      learned: '',
      blocked: '',
      next: '',
    })

    await expect(repository.importSnapshot('{not-json}')).rejects.toThrow(
      'Failed to import snapshot: invalid JSON.',
    )

    await expect(repository.get(asDateKey('2026-08-16'))).resolves.toMatchObject({
      date: '2026-08-16',
      done: 'Keep me',
    })
  })

  it('preserves the existing snapshot when import version is invalid', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Keep versioned data',
      learned: '',
      blocked: '',
      next: '',
    })

    await expect(
      repository.importSnapshot(
        JSON.stringify({
          version: 2,
          logs: {},
        }),
      ),
    ).rejects.toThrow('Failed to import snapshot: unsupported version 2.')

    await expect(repository.get(asDateKey('2026-08-16'))).resolves.toMatchObject({
      date: '2026-08-16',
      done: 'Keep versioned data',
    })
  })

  it('preserves the existing snapshot when import logs is not an object', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Keep object snapshot',
      learned: '',
      blocked: '',
      next: '',
    })

    const before = await repository.exportSnapshot()

    await expect(
      repository.importSnapshot(
        JSON.stringify({
          version: 1,
          logs: [],
        }),
      ),
    ).rejects.toThrow('Failed to import snapshot: logs must be an object.')

    await expect(repository.exportSnapshot()).resolves.toBe(before)
  })

  it('preserves the existing snapshot when a log entry shape is invalid', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Keep valid log',
      learned: '',
      blocked: '',
      next: '',
    })

    await expect(
      repository.importSnapshot(
        JSON.stringify({
          version: 1,
          logs: {
            '2026-08-17': {
              date: '2026-08-17',
              done: 'Broken log',
              learned: '',
              blocked: '',
              next: '',
              createdAt: 123,
              updatedAt: '2026-08-17T10:00:00.000Z',
            },
          },
        }),
      ),
    ).rejects.toThrow('Failed to import snapshot: invalid log entry for 2026-08-17.')

    await expect(repository.list()).resolves.toMatchObject([
      {
        date: '2026-08-16',
        done: 'Keep valid log',
      },
    ])
  })

  it('preserves the existing snapshot when import mixes valid and invalid logs', async () => {
    const { repository } = await createRepositoryFixture()

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: 'Keep mixed snapshot guard',
      learned: '',
      blocked: '',
      next: '',
    })

    const before = await repository.exportSnapshot()

    await expect(
      repository.importSnapshot(
        JSON.stringify({
          version: 1,
          logs: {
            '2026-08-17': {
              date: '2026-08-17',
              done: 'Valid candidate',
              learned: '',
              blocked: '',
              next: '',
              createdAt: '2026-08-17T09:00:00.000Z',
              updatedAt: '2026-08-17T09:30:00.000Z',
            },
            '2026-08-18': {
              date: '2026-08-18',
              done: 'Broken candidate',
              learned: '',
              blocked: '',
              next: '',
              createdAt: 'not-a-date',
              updatedAt: '2026-08-18T09:30:00.000Z',
            },
          },
        }),
      ),
    ).rejects.toThrow('Failed to import snapshot: invalid log entry for 2026-08-18.')

    await expect(repository.exportSnapshot()).resolves.toBe(before)
  })
})
