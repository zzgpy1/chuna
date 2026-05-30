import { defineStore } from 'pinia'

const STORAGE_KEY = 'cashier_auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false
  }),
  actions: {
    setAuthenticated(value) {
      this.isAuthenticated = value
      if (value) {
        localStorage.setItem(STORAGE_KEY, 'true')
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    // 初始化时从 localStorage 恢复状态
    checkAuth() {
      const stored = localStorage.getItem(STORAGE_KEY)
      this.isAuthenticated = stored === 'true'
    }
  }
})
