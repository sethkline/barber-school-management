// server/api/auth/logout.post.ts
import { H3Event, deleteCookie } from 'h3'
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const supabase = getSupabaseClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Clear the auth cookies
    deleteCookie(event, 'access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
    
    deleteCookie(event, 'refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })

    return { success: true }
  } catch (error: any) {
    return createError({
      statusCode: 500,
      message: error.message || 'Failed to logout'
    })
  }
})