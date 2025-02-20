// server/api/auth/me.ts
import { getSupabaseClient } from '~/server/utils/supabaseClient'
import { getCookie } from 'h3'

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
    
    // You may need to fetch additional user data from your database
    // Based on your Supabase schema from the uploaded files
    // It seems you don't have a profiles table yet, so let's use students table
    // if the user is a student, or another appropriate table based on role
    
    const user = data.user
    let firstName = null
    let lastName = null
    let role = 'user' // Default role
    
    // Try to find the user in the students table
    const { data: studentData } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('email', user.email)
      .single()
      
    if (studentData) {
      firstName = studentData.first_name
      lastName = studentData.last_name
      role = 'student'
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
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