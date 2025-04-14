import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReceiptView from '../views/ReceiptView.vue'
import MeetingSummaryView from '../views/MeetingSummaryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/receipt',
      name: 'receipt',
      component: ReceiptView,
    },
    {
      path: '/meeting-summary',
      name: 'meeting-summary',
      component: MeetingSummaryView,
    },
  ],
})

export default router
