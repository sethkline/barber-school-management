import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { getSupabaseClient } from '~/server/utils/supabaseClient'

export default defineEventHandler(async (event) => {
  try {
    // Get the access token
    const accessToken = getCookie(event, 'access_token')
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }
    
    // Get the profile data from the request body
    const profileData = await readBody(event)
    
    // Get Supabase client
    const supabase = getSupabaseClient()
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !userData.user) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }
    
    const user = userData.user
    
    // Prepare metadata update - preserve existing metadata
    const currentMetadata = user.user_metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone
    }
    
    // Update user metadata using admin API
    const adminClient = supabase.auth.admin
    
    if (!adminClient) {
      throw createError({
        statusCode: 500,
        message: 'Admin API not available'
      })
    }
    
    const { error: updateError } = await adminClient.updateUserById(
      user.id, 
      { user_metadata: updatedMetadata }
    )
    
    if (updateError) {
      throw createError({
        statusCode: 500,
        message: updateError.message
      })
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        role: updatedMetadata.role || 'user',
        profileImageUrl: updatedMetadata.profile_image_url
      }
    }
  } catch (error) {
    console.error('Profile update error:', error)
    
    return {
      success: false,
      message: error.message || 'Failed to update profile'
    }
  }
})