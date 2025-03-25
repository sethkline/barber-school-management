// server/api/auth/me.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'
import { getCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Get the access token from cookie
    const accessToken = getCookie(event, 'access_token')
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        message: 'No access token found'
      })
    }
    
    // Create a Supabase client with the access token
    const supabase = getSupabaseClient()
    
    // Set the auth token manually for the API call
    const { data, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !data.user) {
      console.error('Error getting user:', error)
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token'
      })
    }
    
    const user = data.user
    
    // Extract metadata
    const userMetadata = user.user_metadata || {}
    const appMetadata = user.app_metadata || {}
    
    // Get first name and last name from metadata if available
    let firstName = userMetadata.first_name || null
    let lastName = userMetadata.last_name || null
    
    // Extract additional fields from metadata
    let phone = userMetadata.phone || null
    let profileImageUrl = userMetadata.profile_image_url || null
    
    // Extract role from metadata, with appropriate fallbacks
    let role = userMetadata.role || appMetadata.role || 'admin' // Default to admin for now
    
    // If no first/last name in metadata, try to find it in the students table
    if (!firstName || !lastName) {
      const { data: studentData } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single()
        
      if (studentData) {
        firstName = studentData.first_name
        lastName = studentData.last_name
        // Don't override the role if we already found it in metadata
      }
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      phone,
      profileImageUrl,
      role,
      isAuthenticated: true
    }
  } catch (error: any) {
    console.error('Authentication error:', error)
    throw createError({
      statusCode: 401,
      message: error.message || 'Unauthorized'
    })
  }
})