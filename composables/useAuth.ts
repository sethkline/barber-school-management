// composables/useAuth.ts
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { AuthState, UserCredentials } from '~/types/auth'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const router = useRouter()
  
  const state = reactive<AuthState>({
    user: null,
    loading: false,
    error: null
  })

  // Initialize the session on composable creation
  const initializeSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    state.user = session?.user || null
  }
  initializeSession()

  const signIn = async (credentials: UserCredentials) => {
    try {
      state.loading = true
      state.error = null
      
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error

      state.user = user
      router.push('/dashboard')
    } catch (err: any) {
      state.error = err.message
    } finally {
      state.loading = false
    }
  }

  const signOut = async () => {
    try {
      state.loading = true
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      state.user = null
      router.push('/login')
    } catch (err: any) {
      state.error = err.message
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    signIn,
    signOut
  }
}
