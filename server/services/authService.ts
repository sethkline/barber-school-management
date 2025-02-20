// server/services/authService.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export const authService = {
  async login({ email, password }: { email: string, password: string }) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) throw new Error(error.message)
    
    // Additional custom login logic (logging, setting cookies, etc.) can be added here.
    return data
  },
  // Other authentication functions (logout, reset-password, change-password)...
}
