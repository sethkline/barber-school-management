import { H3Event, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const types = await assessmentService.getAssessmentTypes()
    return types
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})