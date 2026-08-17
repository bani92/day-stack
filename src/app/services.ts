import type { InjectionKey } from 'vue'
import { LocalStorageDailyLogRepository } from '../infrastructure/repositories/local-storage-daily-log-repository'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import { BrowserLocalStorage } from '../infrastructure/storage/browser-local-storage'
import { createConfiguredAuthGateway, type AuthGateway } from '../infrastructure/auth/auth-gateway'
import { createConfiguredSupabaseDailyLogRepository } from '../infrastructure/repositories/supabase-daily-log-repository'

export interface AppServices {
  dailyLogRepository: DailyLogRepository
  authGateway: AuthGateway
}

export const appServicesKey: InjectionKey<AppServices> = Symbol('daystack-app-services')

export function createAppServices(): AppServices {
  const authGateway = createConfiguredAuthGateway()
  let dailyLogRepository: DailyLogRepository

  try {
    dailyLogRepository = createConfiguredSupabaseDailyLogRepository(authGateway)
  } catch {
    dailyLogRepository = new LocalStorageDailyLogRepository(new BrowserLocalStorage())
  }

  return {
    dailyLogRepository,
    authGateway,
  }
}
