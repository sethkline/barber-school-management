// Logout endpoint
import { cognitoService } from '~/server/utils/cognitoClient'

export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')

  try {
    // Sign out from Cognito (invalidate all tokens)
    if (accessToken) {
      await cognitoService.signOut(accessToken)
    }
  } catch (error: any) {
    // Log but don't fail - user might already be signed out
    console.error('Logout error:', error.message)
  }

  // Clear all auth cookies
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

  deleteCookie(event, 'id_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  return { success: true }
})
