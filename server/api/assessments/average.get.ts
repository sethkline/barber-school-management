import { H3Event, getQuery, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const assessmentType = query.type
    
    if (!assessmentType) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Assessment type is required' 
      }))
    }
    
    const average = await assessmentService.getAverageScores(String(assessmentType))
    return average
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})