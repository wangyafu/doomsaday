import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/rebirth',
      name: 'Rebirth',
      component: () => import('@/views/Rebirth.vue')
    },
    {
      path: '/profession',
      name: 'ProfessionSelect',
      component: () => import('@/views/ProfessionSelect.vue')
    },
    {
      path: '/market',
      name: 'Market',
      component: () => import('@/views/Market.vue')
    },
    {
      path: '/survival',
      name: 'Survival',
      component: () => import('@/views/Survival.vue')
    },
    {
      path: '/ending',
      name: 'Ending',
      component: () => import('@/views/Ending.vue')
    }
  ]
})

export default router
