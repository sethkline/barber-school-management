import { defineStore } from 'pinia';
interface UserState {
  id: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    email: null,
    firstName: null,
    lastName: null,
    role: null,
    isAuthenticated: false
  }),
  
  getters: {
    fullName: (state) => {
      if (state.firstName && state.lastName) {
        return `${state.firstName} ${state.lastName}`
      }
      return state.email || 'User'
    }
  },
  
  actions: {
    setUser(userData: Partial<UserState>) {
      Object.assign(this, userData)
      this.isAuthenticated = true
    },
    
    clearUser() {
      this.id = null
      this.email = null
      this.firstName = null
      this.lastName = null
      this.role = null
      this.isAuthenticated = false
    },
    
    async fetchCurrentUser() {
      try {
        const userData = await $fetch('/api/auth/me')
        this.setUser(userData)
        return userData
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        this.clearUser()
        return null
      }
    }
  }
})