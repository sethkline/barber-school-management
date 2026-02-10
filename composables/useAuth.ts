// composables/useAuth.ts - Client-side authentication with Cognito
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AuthState, UserCredentials } from '~/types/auth'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  profileImageUrl?: string
  isAuthenticated: boolean
}

export const useAuth = () => {
  const router = useRouter()

  const state = reactive<AuthState>({
    user: null,
    loading: false,
    error: null
  })

  const isAuthenticated = ref(false)

  // Initialize the session by checking with the server
  const initializeSession = async () => {
    try {
      state.loading = true
      const response = await $fetch<AuthUser>('/api/auth/me', {
        credentials: 'include'
      })

      if (response && response.isAuthenticated) {
        state.user = response
        isAuthenticated.value = true
      } else {
        state.user = null
        isAuthenticated.value = false
      }
    } catch (error: any) {
      // Not authenticated or session expired
      state.user = null
      isAuthenticated.value = false
    } finally {
      state.loading = false
    }
  }

  // Call initializeSession on composable creation
  initializeSession()

  const signIn = async (credentials: UserCredentials) => {
    try {
      state.loading = true
      state.error = null

      const response = await $fetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password
        },
        credentials: 'include'
      })

      if (response && response.user) {
        state.user = response.user
        isAuthenticated.value = true
        router.push('/dashboard')
      }
    } catch (err: any) {
      state.error = err.data?.message || err.message || 'Login failed'
      throw err
    } finally {
      state.loading = false
    }
  }

  const signOut = async () => {
    try {
      state.loading = true

      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      state.user = null
      isAuthenticated.value = false
      router.push('/login')
    } catch (err: any) {
      state.error = err.data?.message || err.message || 'Logout failed'
      // Still clear local state even if server call fails
      state.user = null
      isAuthenticated.value = false
      router.push('/login')
    } finally {
      state.loading = false
    }
  }

  const refreshSession = async () => {
    await initializeSession()
  }

  const getCurrentUser = () => {
    return state.user
  }

  return {
    state,
    isAuthenticated,
    signIn,
    signOut,
    refreshSession,
    getCurrentUser,
    initializeSession
  }
}
