import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import { isDateKey } from '../domain/date-key'
import TodayView from '../views/TodayView.vue'
import DailyLogView from '../views/DailyLogView.vue'
import RoutePlaceholderView from '../views/RoutePlaceholderView.vue'

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
    component: RoutePlaceholderView,
    props: {
      eyebrow: '찾기',
      title: '기록 찾기',
      description: '날짜별 기록을 탐색하는 화면입니다.',
    },
  },
  {
    path: '/review',
    name: 'review',
    component: RoutePlaceholderView,
    props: {
      eyebrow: '돌아보기',
      title: '돌아보기',
      description: '연속성과 월간 흐름을 살펴보는 화면입니다.',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: RoutePlaceholderView,
    props: {
      eyebrow: '설정',
      title: '설정',
      description: '저장과 백업 같은 앱 설정을 두는 자리입니다.',
    },
  },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes: routeRecords,
  })
}
