// Auth middleware - validates Cognito JWT tokens
import { cognitoService, type CognitoUser } from '~/server/utils/cognitoClient'

// Extend H3EventContext to include user
declare module 'h3' {
  interface H3EventContext {
    user?: CognitoUser
  }
}

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const path = event.path || ''
  if (path.startsWith('/api/public/') || path === '/api/health') {
    return
  }

  const accessToken = getCookie(event, 'access_token')

  if (accessToken) {
    try {
      // Verify the JWT token
      const payload = await cognitoService.verifyToken(accessToken)

      // Get full user details
      const user = await cognitoService.getUser(accessToken)

      // Set the user in the event context
      event.context.user = user
      console.log('User set in context:', user.id)
    } catch (err: any) {
      console.error('Auth middleware error:', err.message)
      // Token is invalid or expired - don't throw, just don't set user
      // The individual endpoints can decide if authentication is required
    }
  }
})
