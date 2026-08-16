import type { DailyLog, DailyLogInput } from '../../domain/daily-log'
import { isMeaningfulLog } from '../../domain/daily-log'
import type { DateKey } from '../../domain/date-key'
import { isDateKey } from '../../domain/date-key'
import type { KeyValueStorage } from '../storage/key-value-storage'
import type { DailyLogRepository } from './daily-log-repository'

const STORAGE_KEY = 'daystack:data'
const SNAPSHOT_VERSION = 1

interface Snapshot {
  version: 1
  logs: Record<string, DailyLog>
}

interface DailyLogRecord extends DailyLogInput {
  date: string
  createdAt: string
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isDailyLogShape(value: unknown, expectedDate: string): value is DailyLog {
  if (!isRecord(value)) {
    return false
  }

  const candidate = value as Partial<DailyLogRecord>

  if (
    candidate.date !== expectedDate ||
    !isDateKey(candidate.date) ||
    typeof candidate.done !== 'string' ||
    typeof candidate.learned !== 'string' ||
    typeof candidate.blocked !== 'string' ||
    typeof candidate.next !== 'string' ||
    !isIsoTimestamp(candidate.createdAt) ||
    !isIsoTimestamp(candidate.updatedAt)
  ) {
    return false
  }

  return isMeaningfulLog({
    done: candidate.done,
    learned: candidate.learned,
    blocked: candidate.blocked,
    next: candidate.next,
  })
}

function createEmptySnapshot(): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    logs: {},
  }
}

function assertSnapshot(value: unknown, context: 'stored' | 'import'): asserts value is Snapshot {
  if (!isRecord(value)) {
    throw new Error(
      context === 'stored'
        ? 'Stored snapshot is invalid.'
        : 'Failed to import snapshot: snapshot must be an object.',
    )
  }

  if (value.version !== SNAPSHOT_VERSION) {
    throw new Error(
      context === 'stored'
        ? `Stored snapshot version ${String(value.version)} is unsupported.`
        : `Failed to import snapshot: unsupported version ${String(value.version)}.`,
    )
  }

  if (!isRecord(value.logs)) {
    throw new Error(
      context === 'stored'
        ? 'Stored snapshot logs are invalid.'
        : 'Failed to import snapshot: logs must be an object.',
    )
  }

  for (const [date, log] of Object.entries(value.logs)) {
    if (!isDateKey(date) || !isDailyLogShape(log, date)) {
      throw new Error(
        context === 'stored'
          ? `Stored snapshot contains an invalid log entry for ${date}.`
          : `Failed to import snapshot: invalid log entry for ${date}.`,
      )
    }
  }
}

function sortLogsDescending(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((left, right) => right.date.localeCompare(left.date))
}

export class LocalStorageDailyLogRepository implements DailyLogRepository {
  private readonly storage: KeyValueStorage

  constructor(storage: KeyValueStorage) {
    this.storage = storage
  }

  async get(date: DateKey): Promise<DailyLog | null> {
    const snapshot = this.readSnapshot()

    return snapshot.logs[date] ?? null
  }

  async list(): Promise<DailyLog[]> {
    const snapshot = this.readSnapshot()

    return sortLogsDescending(Object.values(snapshot.logs))
  }

  async save(input: DailyLogInput & { date: DateKey }): Promise<DailyLog> {
    if (!isMeaningfulLog(input)) {
      throw new Error('Cannot save an empty daily log.')
    }

    const snapshot = this.readSnapshot()
    const existingLog = snapshot.logs[input.date]
    const timestamp = new Date().toISOString()
    const nextLog: DailyLog = {
      ...input,
      createdAt: existingLog?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    snapshot.logs[input.date] = nextLog
    this.writeSnapshot(snapshot)

    return nextLog
  }

  async remove(date: DateKey): Promise<void> {
    const snapshot = this.readSnapshot()

    if (!(date in snapshot.logs)) {
      return
    }

    delete snapshot.logs[date]
    this.writeSnapshot(snapshot)
  }

  async exportSnapshot(): Promise<string> {
    return JSON.stringify(this.readSnapshot())
  }

  async importSnapshot(serialized: string): Promise<void> {
    let parsed: unknown

    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Failed to import snapshot: invalid JSON.')
    }

    assertSnapshot(parsed, 'import')
    this.writeSnapshot({
      version: SNAPSHOT_VERSION,
      logs: sortLogsDescending(Object.values(parsed.logs)).reduce<Record<string, DailyLog>>(
        (logs, log) => {
          logs[log.date] = log
          return logs
        },
        {},
      ),
    })
  }

  private readSnapshot(): Snapshot {
    const snapshot = this.storage.get<unknown>(STORAGE_KEY)

    if (snapshot === null) {
      return createEmptySnapshot()
    }

    assertSnapshot(snapshot, 'stored')

    return {
      version: SNAPSHOT_VERSION,
      logs: Object.fromEntries(sortLogsDescending(Object.values(snapshot.logs)).map(log => [log.date, log])),
    }
  }

  private writeSnapshot(snapshot: Snapshot): void {
    this.storage.set(STORAGE_KEY, snapshot)
  }
}
