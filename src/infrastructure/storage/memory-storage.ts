import type { KeyValueStorage } from './key-value-storage'

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export class MemoryStorage implements KeyValueStorage {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    const value = this.store.get(key)

    if (value === undefined) {
      return null
    }

    return cloneValue(value) as T
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, cloneValue(value))
  }

  remove(key: string): void {
    this.store.delete(key)
  }
}
