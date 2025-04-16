import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../components/AudioWorkletSTT.vue'
import ReceiptView from '../views/ReceiptView.vue'
import MeetingSummaryView from '../views/MeetingSummaryView.vue'
import LoginView from '../views/LoginView.vue'
import ScriptListView from '@/views/ScriptListView.vue'
import { loadUserFromStorage } from '../services/userService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/script/:id?',
      name: 'script',
      component: MainView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/receipt',
      name: 'receipt',
      component: ReceiptView,
      meta: { requiresAuth: true },
    },
    {
      path: '/meeting-summary',
      name: 'meeting-summary',
      component: MeetingSummaryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/script-list',
      name: 'script-list',
      component: () => ScriptListView,
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const user = loadUserFromStorage()

  if (to.meta.requiresAuth && !user) {
    next('/login')
  } else if (to.path === '/login' && user) {
    next('/')
  } else {
    next()
  }
})

export default router
