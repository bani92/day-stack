import { inject } from 'vue'

import { createDailyLogStore } from '../stores/daily-log.store'
import type { DailyLogRepository } from '../infrastructure/repositories/daily-log-repository'
import { appServicesKey, type AppServices } from './services'

const storeDefinitions = new WeakMap<DailyLogRepository, ReturnType<typeof createDailyLogStore>>()

function resolveAppServices(services?: AppServices): AppServices {
  const resolvedServices = services ?? inject(appServicesKey, null)

  if (resolvedServices === null) {
    throw new Error('DayStack app services were not provided.')
  }

  return resolvedServices
}

export function useAppDailyLogStore(services?: AppServices) {
  const resolvedServices = resolveAppServices(services)
  const repository = resolvedServices.dailyLogRepository
  let useStore = storeDefinitions.get(repository)

  if (!useStore) {
    useStore = createDailyLogStore(repository)
    storeDefinitions.set(repository, useStore)
  }

  return useStore()
}
