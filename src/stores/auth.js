import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false
  }),
  actions: {
    setAuthenticated(value) {
      this.isAuthenticated = value
      if (value) {
        localStorage.setItem('auth', 'true')
      } else {
        localStorage.removeItem('auth')
      }
    },
    checkAuth() {
      const stored = localStorage.getItem('auth')
      this.isAuthenticated = stored === 'true'
    }
  }
})
