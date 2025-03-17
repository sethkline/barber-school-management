import { H3Event, defineEventHandler } from 'h3'
import { settingsService } from '~/server/services/settingsService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get requirement ID from the URL
    const id = event.context.params?.id
    
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: 'Program requirement ID is required'
      })
    }
    
    // Delete program requirement
    const updatedRequirements = await settingsService.deleteProgramRequirement(id)
    
    return {
      data: updatedRequirements,
      message: 'Program requirement deleted successfully'
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})