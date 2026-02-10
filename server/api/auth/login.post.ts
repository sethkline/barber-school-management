// Login endpoint using Cognito
import { cognitoService } from '~/server/utils/cognitoClient'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  try {
    // Authenticate with Cognito
    const tokens = await cognitoService.signIn(email, password)

    // Get user details
    const user = await cognitoService.getUser(tokens.accessToken)

    // Set cookies
    setCookie(event, 'access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiresIn
    })

    setCookie(event, 'refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    setCookie(event, 'id_token', tokens.idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiresIn
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        is_active: user.isActive
      }
    }
  } catch (error: any) {
    console.error('Login error:', error)

    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    if (error.name === 'UserNotFoundException') {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    if (error.name === 'UserNotConfirmedException') {
      throw createError({
        statusCode: 401,
        message: 'Please verify your email address'
      })
    }

    throw createError({
      statusCode: 500,
      message: `Authentication failed: ${error.message}`
    })
  }
})
