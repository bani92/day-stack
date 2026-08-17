import { describe, expect, it, vi } from 'vitest'

import type { AuthGateway } from '../auth/auth-gateway'
import type { DateKey } from '../../domain/date-key'
import { SupabaseDailyLogRepository, type DailyLogRow, type SupabaseDailyLogClient } from './supabase-daily-log-repository'

function asDateKey(value: string): DateKey {
  return value as DateKey
}

function createRow(overrides: Partial<DailyLogRow> = {}): DailyLogRow {
  return {
    id: 'log-1',
    user_id: 'user-1',
    date: '2026-08-16',
    done: '오늘 한 일',
    learned: '배운 점',
    blocked: '',
    next: '다음 일',
    created_at: '2026-08-16T09:00:00.000Z',
    updated_at: '2026-08-16T09:00:00.000Z',
    ...overrides,
  }
}

function createQuery(result: { data: unknown; error: null | { message: string } }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    upsert: vi.fn(() => query),
    delete: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }

  return query
}

function createRepositoryFixture(
  queries: ReturnType<typeof createQuery>[],
  user: { id: string } | null = { id: 'user-1' },
) {
  const client = {
    from: vi.fn(() => {
      const query = queries.shift()

      if (!query) {
        throw new Error('Unexpected Supabase query')
      }

      return query
    }),
  } as unknown as SupabaseDailyLogClient
  const authGateway: AuthGateway = {
    getCurrentUser: vi.fn(async () => (user ? { ...user, email: 'owner@example.com' } : null)),
    signIn: vi.fn(async () => undefined),
  }

  return {
    repository: new SupabaseDailyLogRepository(client, authGateway),
    client,
    authGateway,
  }
}

describe('SupabaseDailyLogRepository', () => {
  it('saves a meaningful log with the current user id and maps snake case columns', async () => {
    const readQuery = createQuery({ data: null, error: null })
    const saveQuery = createQuery({ data: createRow(), error: null })
    const { repository } = createRepositoryFixture([readQuery, saveQuery])

    const saved = await repository.save({
      date: asDateKey('2026-08-16'),
      done: '오늘 한 일',
      learned: '배운 점',
      blocked: '',
      next: '다음 일',
    })

    expect(saved).toMatchObject({
      date: '2026-08-16',
      done: '오늘 한 일',
      createdAt: '2026-08-16T09:00:00.000Z',
    })
    expect(saveQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', date: '2026-08-16' }),
      { onConflict: 'user_id,date' },
    )
  })

  it('keeps the existing created timestamp when updating a date', async () => {
    const existing = createRow({ created_at: '2026-08-15T09:00:00.000Z' })
    const readQuery = createQuery({ data: existing, error: null })
    const saveQuery = createQuery({ data: createRow({ created_at: existing.created_at }), error: null })
    const { repository } = createRepositoryFixture([readQuery, saveQuery])

    await repository.save({
      date: asDateKey('2026-08-16'),
      done: '수정한 내용',
      learned: '',
      blocked: '',
      next: '',
    })

    expect(saveQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ created_at: '2026-08-15T09:00:00.000Z' }),
      { onConflict: 'user_id,date' },
    )
  })

  it('lists only the current user records ordered by date', async () => {
    const listQuery = createQuery({
      data: [createRow(), createRow({ id: 'log-2', date: '2026-08-15' })],
      error: null,
    })
    const { repository, client } = createRepositoryFixture([listQuery])

    await expect(repository.list()).resolves.toMatchObject([
      { date: '2026-08-16' },
      { date: '2026-08-15' },
    ])

    expect(client.from).toHaveBeenCalledWith('daily_logs')
    expect(listQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(listQuery.order).toHaveBeenCalledWith('date', { ascending: false })
  })

  it('deletes only the current user record for the requested date', async () => {
    const deleteQuery = createQuery({ data: null, error: null })
    const { repository } = createRepositoryFixture([deleteQuery])

    await repository.remove(asDateKey('2026-08-16'))

    expect(deleteQuery.delete).toHaveBeenCalledOnce()
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1')
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, 'date', '2026-08-16')
  })

  it('rejects data access when there is no authenticated user', async () => {
    const { repository } = createRepositoryFixture([], null)

    await expect(repository.list()).rejects.toThrow('로그인 후 기록을 사용할 수 있습니다.')
  })
})
