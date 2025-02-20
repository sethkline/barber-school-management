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
    
    // Return only the necessary user information.
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        // Optionally, if you want to pass a role or other minimal info:
        role: result.user.role
      }
    }
  } catch (error: any) {
    // Return an error response if something goes wrong.
    return sendError(event, createError({ statusCode: 400, statusMessage: error.message }))
  }
})
