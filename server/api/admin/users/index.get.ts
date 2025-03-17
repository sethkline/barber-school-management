import { H3Event, defineEventHandler } from 'h3'
import { userService } from '~/server/services/userService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get query parameters
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const search = query.search as string || ''
    const role = query.role as string || ''
    
    // Fetch users
    const { data, count } = await userService.getUsers({
      page,
      limit,
      search,
      role
    })
    
    return {
      data,
      count,
      page,
      limit
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})