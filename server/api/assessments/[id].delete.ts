import { H3Event, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = event.context.params?.id
    
    if (!id) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Assessment ID is required' 
      }))
    }
    
    const result = await assessmentService.deleteAssessment(id)
    return result
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})