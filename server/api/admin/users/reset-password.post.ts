import { H3Event, defineEventHandler, readBody } from 'h3'
import { userService } from '~/server/services/userService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get user ID and new password from request body
    const { id, password } = await readBody(event)
    
    if (!id || !password) {
      return createError({
        statusCode: 400,
        statusMessage: 'User ID and password are required'
      })
    }
    
    // Reset user password
    await userService.resetUserPassword(id, password)
    
    return {
      success: true,
      message: 'Password reset successfully'
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})