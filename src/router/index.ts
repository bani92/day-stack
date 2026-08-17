import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import { isDateKey } from '../domain/date-key'
import TodayView from '../views/TodayView.vue'
import DailyLogView from '../views/DailyLogView.vue'
import ArchiveView from '../views/ArchiveView.vue'
import ReviewView from '../views/ReviewView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import type { AuthGateway } from '../infrastructure/auth/auth-gateway'

export interface AppRouterOptions {
  authGateway?: AuthGateway
}

const routeRecords: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: TodayView,
    meta: { requiresAuth: true },
  },
  {
    path: '/day/:date',
    name: 'day',
    component: DailyLogView,
    meta: { requiresAuth: true },
    beforeEnter: to => {
      const routeDate = typeof to.params.date === 'string' ? to.params.date : ''

      if (!isDateKey(routeDate)) {
        return { path: '/today' }
      }

      return true
    },
  },
  {
    path: '/archive',
    name: 'archive',
    component: ArchiveView,
    meta: { requiresAuth: true },
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
]

export function createAppRouter(
  history: RouterHistory = createWebHistory(),
  options: AppRouterOptions = {},
) {
  const router = createRouter({
    history,
    routes: routeRecords,
  })

  if (!options.authGateway) {
    return router
  }

  router.beforeEach(async to => {
    try {
      const user = await options.authGateway?.getCurrentUser()

      if (to.name === 'login') {
        return user ? { name: 'today' } : true
      }

      if (!to.meta.requiresAuth || user) {
        return true
      }
    } catch {
      if (to.name === 'login') {
        return true
      }
    }

    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  })

  return router
}
