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

    // Get the profile data from the request body
    const profileData = await readBody(event)

    // Get current user from Cognito
    const currentUser = await cognitoService.getUser(accessToken)

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    // Update user attributes in Cognito
    const updatedUser = await cognitoService.adminUpdateUser(currentUser.email, {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone
    })

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profileImageUrl: updatedUser.profileImageUrl
      }
    }
  } catch (error: any) {
    console.error('Profile update error:', error)

    return {
      success: false,
      message: error.message || 'Failed to update profile'
    }
  }
})
