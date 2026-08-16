import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import { isDateKey } from '../domain/date-key'
import TodayView from '../views/TodayView.vue'
import DailyLogView from '../views/DailyLogView.vue'
import ArchiveView from '../views/ArchiveView.vue'
import ReviewView from '../views/ReviewView.vue'
import SettingsView from '../views/SettingsView.vue'

const routeRecords: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: TodayView,
  },
  {
    path: '/day/:date',
    name: 'day',
    component: DailyLogView,
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
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewView,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
  },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes: routeRecords,
  })
}
