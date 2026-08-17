import { isMeaningfulLog, type DailyLog, type DailyLogInput } from '../../domain/daily-log'
import { isDateKey, type DateKey } from '../../domain/date-key'
import type { AuthGateway } from '../auth/auth-gateway'
import { createSupabaseClient } from '../supabase/client'
import type { DailyLogRepository } from './daily-log-repository'

export interface DailyLogRow {
  id: string
  user_id: string
  date: string
  done: string
  learned: string
  blocked: string
  next: string
  created_at: string
  updated_at: string
}

interface SupabaseResult<T> {
  data: T
  error: { message: string } | null
}

export interface SupabaseDailyLogQuery extends PromiseLike<SupabaseResult<DailyLogRow[] | null>> {
  select(columns?: string): SupabaseDailyLogQuery
  eq(column: string, value: string): SupabaseDailyLogQuery
  order(column: string, options: { ascending: boolean }): SupabaseDailyLogQuery
  upsert(
    values: Partial<DailyLogRow>,
    options: { onConflict: string },
  ): SupabaseDailyLogQuery
  delete(): SupabaseDailyLogQuery
  maybeSingle(): Promise<SupabaseResult<DailyLogRow | null>>
  single(): Promise<SupabaseResult<DailyLogRow>>
}

export interface SupabaseDailyLogClient {
  from(table: 'daily_logs'): SupabaseDailyLogQuery
}

function toDailyLog(row: DailyLogRow): DailyLog {
  if (
    !isDateKey(row.date) ||
    typeof row.done !== 'string' ||
    typeof row.learned !== 'string' ||
    typeof row.blocked !== 'string' ||
    typeof row.next !== 'string' ||
    Number.isNaN(Date.parse(row.created_at)) ||
    Number.isNaN(Date.parse(row.updated_at))
  ) {
    throw new Error('Supabase returned an invalid daily log.')
  }

  return {
    date: row.date as DateKey,
    done: row.done,
    learned: row.learned,
    blocked: row.blocked,
    next: row.next,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: DailyLogInput & { date: DateKey }, userId: string, createdAt: string, updatedAt: string): Partial<DailyLogRow> {
  return {
    user_id: userId,
    date: input.date,
    done: input.done,
    learned: input.learned,
    blocked: input.blocked,
    next: input.next,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function toError(error: { message: string } | null): Error | null {
  return error ? new Error(error.message) : null
}

export class SupabaseDailyLogRepository implements DailyLogRepository {
  private readonly client: SupabaseDailyLogClient
  private readonly authGateway: AuthGateway

  constructor(
    client: SupabaseDailyLogClient,
    authGateway: AuthGateway,
  ) {
    this.client = client
    this.authGateway = authGateway
  }

  async get(date: DateKey): Promise<DailyLog | null> {
    const user = await this.requireUser()
    const { data, error } = await this.client
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()

    const cause = toError(error)
    if (cause) {
      throw cause
    }

    return data ? toDailyLog(data) : null
  }

  async list(): Promise<DailyLog[]> {
    const user = await this.requireUser()
    const { data, error } = await this.client
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    const cause = toError(error)
    if (cause) {
      throw cause
    }

    if (!data) {
      return []
    }

    return data.map(toDailyLog)
  }

  async save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog> {
    if (!isMeaningfulLog(input)) {
      throw new Error('Cannot save an empty daily log.')
    }

    const user = await this.requireUser()
    const existing = await this.get(input.date)
    const timestamp = new Date().toISOString()
    const row = toRow(input, user.id, existing?.createdAt ?? timestamp, timestamp)
    const { data, error } = await this.client
      .from('daily_logs')
      .upsert(row, { onConflict: 'user_id,date' })
      .select('*')
      .single()

    const cause = toError(error)
    if (cause) {
      throw cause
    }

    return toDailyLog(data)
  }

  async remove(date: DateKey): Promise<void> {
    const user = await this.requireUser()
    const { error } = await this.client
      .from('daily_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('date', date)

    const cause = toError(error)
    if (cause) {
      throw cause
    }
  }

  async clear(): Promise<void> {
    const user = await this.requireUser()
    const { error } = await this.client.from('daily_logs').delete().eq('user_id', user.id)

    const cause = toError(error)
    if (cause) {
      throw cause
    }
  }

  async exportSnapshot(): Promise<string> {
    const logs = await this.list()
    const byDate = logs.reduce<Record<string, DailyLog>>((result, log) => {
      result[log.date] = log
      return result
    }, {})

    return JSON.stringify({ version: 1, logs: byDate })
  }

  async importSnapshot(serialized: string): Promise<void> {
    let parsed: unknown

    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Failed to import snapshot: invalid JSON.')
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed) ||
      (parsed as { version?: unknown }).version !== 1 ||
      typeof (parsed as { logs?: unknown }).logs !== 'object' ||
      (parsed as { logs?: unknown }).logs === null ||
      Array.isArray((parsed as { logs?: unknown }).logs)
    ) {
      throw new Error('Failed to import snapshot: invalid snapshot.')
    }

    const user = await this.requireUser()
    const logs = (parsed as { logs: Record<string, unknown> }).logs

    for (const [date, value] of Object.entries(logs)) {
      if (
        !isDateKey(date) ||
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value)
      ) {
        throw new Error(`Failed to import snapshot: invalid log entry for ${date}.`)
      }

      const log = value as Partial<DailyLog>
      const logInput = {
        done: log.done,
        learned: log.learned,
        blocked: log.blocked,
        next: log.next,
      }
      if (
        log.date !== date ||
        typeof logInput.done !== 'string' ||
        typeof logInput.learned !== 'string' ||
        typeof logInput.blocked !== 'string' ||
        typeof logInput.next !== 'string' ||
        typeof log.createdAt !== 'string' ||
        typeof log.updatedAt !== 'string' ||
        Number.isNaN(Date.parse(log.createdAt)) ||
        Number.isNaN(Date.parse(log.updatedAt)) ||
        !isMeaningfulLog(logInput as DailyLogInput)
      ) {
        throw new Error(`Failed to import snapshot: invalid log entry for ${date}.`)
      }

      const input: DailyLogInput & { date: DateKey } = {
        date: date as DateKey,
        done: logInput.done as string,
        learned: logInput.learned as string,
        blocked: logInput.blocked as string,
        next: logInput.next as string,
      }

      const { error } = await this.client
        .from('daily_logs')
        .upsert(toRow(input, user.id, log.createdAt, log.updatedAt), {
          onConflict: 'user_id,date',
        })

      const cause = toError(error)
      if (cause) {
        throw cause
      }
    }
  }

  private async requireUser() {
    const user = await this.authGateway.getCurrentUser()

    if (!user) {
      throw new Error('로그인 후 기록을 사용할 수 있습니다.')
    }

    return user
  }
}

export function createConfiguredSupabaseDailyLogRepository(authGateway: AuthGateway): DailyLogRepository {
  return new SupabaseDailyLogRepository(
    createSupabaseClient() as unknown as SupabaseDailyLogClient,
    authGateway,
  )
}
