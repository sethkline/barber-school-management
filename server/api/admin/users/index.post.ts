import { H3Event, defineEventHandler, readBody } from 'h3'
import { userService } from '~/server/services/userService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get user data from request body
    const userData = await readBody(event)
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name || !userData.role) {
      return createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    // Create user
    const user = await userService.createUser({
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      phone: userData.phone,
      is_active: userData.is_active !== undefined ? userData.is_active : true
    })
    
    return user
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})