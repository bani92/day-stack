import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import RoutePlaceholderView from '../views/RoutePlaceholderView.vue'

const routeRecords: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: RoutePlaceholderView,
    props: {
      eyebrow: 'Today',
      title: '오늘의 기록',
      description: '하루에 하나만 남기는 Daily Log를 시작할 자리입니다.',
    },
  },
  {
    path: '/day/:date',
    name: 'day',
    component: RoutePlaceholderView,
    props: route => ({
      eyebrow: 'Day',
      title: `기록 보기 ${route.params.date}`,
      description: '선택한 날짜의 Daily Log를 표시할 자리입니다.',
    }),
  },
  {
    path: '/archive',
    name: 'archive',
    component: RoutePlaceholderView,
    props: {
      eyebrow: 'Archive',
      title: '아카이브',
      description: '날짜별 기록을 탐색하는 화면입니다.',
    },
  },
  {
    path: '/review',
    name: 'review',
    component: RoutePlaceholderView,
    props: {
      eyebrow: 'Review',
      title: '돌아보기',
      description: '연속성과 월간 흐름을 살펴보는 화면입니다.',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: RoutePlaceholderView,
    props: {
      eyebrow: 'Settings',
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
