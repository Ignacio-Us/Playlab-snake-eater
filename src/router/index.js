import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/snake-eater',
    },
    {
      path: '/snake-eater',
      name: 'SnakeWelcome',
      component: () => import('@/views/SnakeWelcomeView.vue'),
    },
    {
      path: '/snake-eater/instructions',
      name: 'SnakeInstructions',
      component: () => import('@/views/SnakeInstructions.vue'),
    },
    {
      path: '/snake-eater/game',
      name: 'SnakeGame',
      component: () => import('@/views/SnakeGameView.vue'),
    },
  ],
})

export default router
