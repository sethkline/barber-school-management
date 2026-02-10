// Get current user endpoint
import { cognitoService } from '~/server/utils/cognitoClient'

export default defineEventHandler(async (event) => {
  const accessToken = getCookie(event, 'access_token')

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  try {
    // Get user from Cognito
    const user = await cognitoService.getUser(accessToken)

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      isAuthenticated: true
    }
  } catch (error: any) {
    console.error('Get user error:', error.message)

    // Try to refresh token
    const refreshToken = getCookie(event, 'refresh_token')
    if (refreshToken) {
      try {
        // We need the email for refresh, try to get it from id_token
        const idToken = getCookie(event, 'id_token')
        let email = ''

        if (idToken) {
          try {
            // Decode the ID token to get email (without verification for refresh)
            const parts = idToken.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))
              email = payload.email
            }
          } catch {
            // Ignore decode errors
          }
        }

        if (email) {
          const tokens = await cognitoService.refreshTokens(refreshToken, email)

          // Update cookies
          setCookie(event, 'access_token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: tokens.expiresIn
          })

          setCookie(event, 'id_token', tokens.idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: tokens.expiresIn
          })

          // Get user with new token
          const user = await cognitoService.getUser(tokens.accessToken)

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
            isAuthenticated: true
          }
        }
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.message)
      }
    }

    // Clear cookies if token is invalid
    deleteCookie(event, 'access_token', { path: '/' })
    deleteCookie(event, 'refresh_token', { path: '/' })
    deleteCookie(event, 'id_token', { path: '/' })

    throw createError({
      statusCode: 401,
      message: 'Session expired. Please login again.'
    })
  }
})
