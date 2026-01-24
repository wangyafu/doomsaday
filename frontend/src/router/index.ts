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
      component: () => import('@/views/zombie/Rebirth.vue')
    },
    {
      path: '/profession',
      name: 'ProfessionSelect',
      component: () => import('@/views/zombie/ProfessionSelect.vue')
    },
    {
      path: '/market',
      name: 'Market',
      component: () => import('@/views/zombie/Market.vue')
    },
    {
      path: '/survival',
      name: 'Survival',
      component: () => import('@/views/zombie/Survival.vue')
    },
    {
      path: '/ending',
      name: 'Ending',
      component: () => import('@/views/zombie/Ending.vue')
    },
    // 冰河末世路由
    {
      path: '/ice-age/start',
      name: 'IceAgeStart',
      component: () => import('@/views/ice-age/IceAgeStart.vue')
    },
    {
      path: '/ice-age/talent',
      name: 'IceAgeTalent',
      component: () => import('@/views/ice-age/IceAgeTalent.vue')
    },
    {
      path: '/ice-age/shelter',
      name: 'IceAgeShelter',
      component: () => import('@/views/ice-age/IceAgeShelter.vue')
    },
    {
      path: '/ice-age/market',
      name: 'IceAgeMarket',
      component: () => import('@/views/ice-age/IceAgeMarket.vue')
    },
    {
      path: '/ice-age/survival',
      name: 'IceAgeSurvival',
      component: () => import('@/views/ice-age/IceAgeSurvival.vue')
    },
    {
      path: '/ice-age/ending',
      name: 'IceAgeEnding',
      component: () => import('@/views/ice-age/IceAgeEnding.vue')
    }
  ]
})

export default router
