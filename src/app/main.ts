import { createPinia } from 'pinia'
import { createApp, type App } from 'vue'
import AppRoot from '../App.vue'
import { createAppRouter } from '../router'
import { appServicesKey, createAppServices, type AppServices } from './services'
import type { Router, RouterHistory } from 'vue-router'

export interface CreateDayStackAppOptions {
  history?: RouterHistory
}

export interface DayStackAppShell {
  app: App<Element>
  pinia: ReturnType<typeof createPinia>
  router: Router
  services: AppServices
}

export function createDayStackApp(options: CreateDayStackAppOptions = {}): DayStackAppShell {
  const app = createApp(AppRoot)
  const pinia = createPinia()
  const services = createAppServices()
  const router = createAppRouter(options.history, { authGateway: services.authGateway })

  app.use(pinia)
  app.use(router)
  app.provide(appServicesKey, services)

  return { app, pinia, router, services }
}

export function mountDayStackApp(selector = '#app', options: CreateDayStackAppOptions = {}) {
  const shell = createDayStackApp(options)
  shell.app.mount(selector)
  return shell
}
