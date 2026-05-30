import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'suppliers', name: 'Suppliers', component: () => import('@/views/Suppliers.vue') },
      { path: 'payments', name: 'Payments', component: () => import('@/views/Payments.vue') },
      { path: 'statistics', name: 'Statistics', component: () => import('@/views/Statistics.vue') },
      { path: 'accounts', name: 'Accounts', component: () => import('@/views/Accounts.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),  // 使用 Hash 模式，避免 GitHub Pages 刷新 404
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
