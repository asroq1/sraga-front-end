import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../components/AudioWorkletSTT.vue'
import ReceiptView from '../views/ReceiptView.vue'
import MeetingSummaryView from '../views/MeetingSummaryView.vue'
import LoginView from '../views/LoginView.vue'
import ScriptListView from '@/views/ScriptListView.vue'
import { loadUserFromStorage } from '../services/userService'
import LandingView from '../views/LandingView.vue'

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
      component: ScriptListView,
      meta: { requiresAuth: true },
    },
    // In your routes array, add the landing page route
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const user = loadUserFromStorage()

  if (to.meta.requiresAuth && !user) {
    next('/login')
  } else {
    next()
  }
})

export default router
