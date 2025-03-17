import { H3Event, defineEventHandler } from 'h3'
import { userService } from '~/server/services/userService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get user ID from the URL
    const id = event.context.params?.id
    
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }
    
    // Delete user
    await userService.deleteUser(id)
    
    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})