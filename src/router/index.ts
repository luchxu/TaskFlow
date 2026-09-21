import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/projects/ProjectListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:projectId',
      name: 'project-detail',
      component: () => import('@/views/projects/ProjectDetailView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/', redirect: '/projects' },
    { path: '/:pathMatch(.*)*', redirect: '/projects' },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.restoreSession()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'projects' }
  }
})
