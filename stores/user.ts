import { defineStore } from 'pinia';

interface UserState {
  id: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  isAuthenticated: boolean
  isLoading?: boolean
  error?: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    email: null,
    firstName: null,
    lastName: null,
    role: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  getters: {
    fullName: (state) => {
      if (state.firstName && state.lastName) {
        return `${state.firstName} ${state.lastName}`
      }
      return state.email || 'User'
    },
    isAdmin: (state) => state.role === 'admin',
    isInstructor: (state) => state.role === 'instructor',
    isStaff: (state) => state.role === 'staff' || state.role === 'instructor' || state.role === 'admin',
    isReceptionist: (state) => state.role === 'receptionist',
    userRole: (state) => {
      return state.role || 'guest'
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
      this.isLoading = true
      this.error = null
      
      try {
        const userData = await $fetch('/api/auth/me')
        this.setUser(userData)
        return userData
      } catch (error: any) {
        console.error('Failed to fetch user data:', error)
        this.error = error.message || 'Failed to fetch user data'
        this.clearUser()
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    async login(credentials: { email: string; password: string }) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: credentials
        })
        
        this.setUser(response.user)
        return true
      } catch (error: any) {
        this.error = error.message || 'Login failed'
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    async logout() {
      this.isLoading = true
      this.error = null
      
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
        this.clearUser()
        return true
      } catch (error: any) {
        this.error = error.message || 'Logout failed'
        return false
      } finally {
        this.isLoading = false
      }
    },
    
    // For testing - set a specific role
    setDemoRole(role: string) {
      this.role = role
      this.isAuthenticated = true
    }
  }
})