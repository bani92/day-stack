import type { KeyValueStorage } from './key-value-storage'

export class BrowserLocalStorage implements KeyValueStorage {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  get<T>(key: string): T | null {
    const serialized = this.storage.getItem(key)

    if (serialized === null) {
      return null
    }

    return JSON.parse(serialized) as T
  }

  set<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.storage.removeItem(key)
  }
}
