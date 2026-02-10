import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { cognitoService } from '~/server/utils/cognitoClient'

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

    // Get current user from Cognito
    const currentUser = await cognitoService.getUser(accessToken)

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    // Update profile image URL in Cognito
    await cognitoService.adminUpdateUser(currentUser.email, {
      profileImageUrl: imageUrl
    })

    return {
      success: true,
      imageUrl
    }
  } catch (error: any) {
    console.error('Profile image update error:', error)

    return {
      success: false,
      message: error.message || 'Failed to update profile image'
    }
  }
})
