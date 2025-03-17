import { H3Event, defineEventHandler, readBody } from 'h3'
import { settingsService } from '~/server/services/settingsService'
import { checkAdminRole } from '~/server/utils/authUtils'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Check if the user has admin privileges
    await checkAdminRole(event)
    
    // Get program requirement data from request body
    const requirementData = await readBody(event)
    
    // Validate required fields
    if (!requirementData.program_name || 
        requirementData.required_hours === undefined || 
        !requirementData.certification_name) {
      return createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    // Add program requirement
    const updatedRequirements = await settingsService.addProgramRequirement(requirementData)
    
    return {
      data: updatedRequirements,
      message: 'Program requirement added successfully'
    }
  } catch (error: any) {
    const status = error.status || 500
    return createError({
      statusCode: status,
      statusMessage: error.message
    })
  }
})