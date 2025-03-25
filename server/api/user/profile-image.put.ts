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
    
    // Get the image URL from the request body
    const { imageUrl } = await readBody(event)
    
    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        message: 'Image URL is required'
      })
    }
    
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
      profile_image_url: imageUrl
    }
    
    // Update user metadata using admin API
    // Note: Ensure your supabase client has admin privileges for this
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
      imageUrl
    }
  } catch (error) {
    console.error('Profile image update error:', error)
    
    return {
      success: false,
      message: error.message || 'Failed to update profile image'
    }
  }
})