import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/chat',
    children: [
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../views/ChatView.vue'),
        meta: { title: '智能问答', icon: 'ChatDotRound' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/AnalyticsView.vue'),
        meta: { title: '预测分析', icon: 'TrendCharts', roles: ['MANAGER', 'HRBP', 'HR_ADMIN'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/ReportsView.vue'),
        meta: { title: '决策报告', icon: 'Document', roles: ['MANAGER', 'HRBP', 'HR_ADMIN'] }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('../views/KnowledgeView.vue'),
        meta: { title: '知识库', icon: 'Collection', roles: ['HR_ADMIN'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  if (to.meta.roles && !to.meta.roles.includes(userStore.userInfo?.role)) {
    next('/chat')
    return
  }
  next()
})

export default router
