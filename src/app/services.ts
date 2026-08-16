import type { InjectionKey } from 'vue'
import { LocalStorageDailyLogRepository } from '../infrastructure/repositories/local-storage-daily-log-repository'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import { BrowserLocalStorage } from '../infrastructure/storage/browser-local-storage'

export interface AppServices {
  dailyLogRepository: DailyLogRepository
}

export const appServicesKey: InjectionKey<AppServices> = Symbol('daystack-app-services')

export function createAppServices(): AppServices {
  return {
    dailyLogRepository: new LocalStorageDailyLogRepository(new BrowserLocalStorage()),
  }
}
