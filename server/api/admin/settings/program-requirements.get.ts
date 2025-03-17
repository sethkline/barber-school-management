import { H3Event, defineEventHandler } from 'h3'
import { settingsService } from '~/server/services/settingsService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get program requirements
    const programRequirements = await settingsService.getProgramRequirements()
    
    return {
      data: programRequirements
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})