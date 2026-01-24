import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    // 丧尸末日路由
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
    },
    // 冰河末世路由
    {
      path: '/ice-age/start',
      name: 'IceAgeStart',
      component: () => import('@/views/IceAgeStart.vue')
    },
    {
      path: '/ice-age/talent',
      name: 'IceAgeTalent',
      component: () => import('@/views/IceAgeTalent.vue')
    },
    {
      path: '/ice-age/shelter',
      name: 'IceAgeShelter',
      component: () => import('@/views/IceAgeShelter.vue')
    },
    {
      path: '/ice-age/market',
      name: 'IceAgeMarket',
      component: () => import('@/views/IceAgeMarket.vue')
    },
    {
      path: '/ice-age/survival',
      name: 'IceAgeSurvival',
      component: () => import('@/views/IceAgeSurvival.vue')
    },
    {
      path: '/ice-age/ending',
      name: 'IceAgeEnding',
      component: () => import('@/views/IceAgeEnding.vue')
    }
  ]
})

export default router
