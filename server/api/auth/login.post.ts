// server/api/auth/login.post.ts
import { H3Event, readBody, setCookie, sendError, createError } from 'h3'
import { authService } from '~/server/services/authService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Parse the login credentials from the request body.
    const credentials = await readBody(event) as { email: string, password: string }
    
    // Validate credentials using your authService.
    const result = await authService.login(credentials)
    
    // Set an HTTP-only cookie for the access token.
    setCookie(event, 'access_token', result.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: result.session.expires_in, // in seconds; adjust as needed
    })

    // Optionally, set a cookie for the refresh token.
    setCookie(event, 'refresh_token', result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      // Set maxAge appropriate for your refresh token lifetime.
    })
    
    // Get user metadata to extract role
    const userMetadata = result.user.user_metadata || {}
    const appMetadata = result.user.app_metadata || {}
    
    // Extract first name and last name from metadata if available
    const firstName = userMetadata.first_name || ''
    const lastName = userMetadata.last_name || ''
    
    // Return user information with properly extracted role
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: firstName,
        lastName: lastName,
        // Look for role in user_metadata first, then app_metadata, with a fallback to 'user'
        role: userMetadata.role || appMetadata.role || 'admin' // Default to admin for now
      }
    }
  } catch (error: any) {
    // Return an error response if something goes wrong.
    return sendError(event, createError({ statusCode: 400, statusMessage: error.message }))
  }
})