import { H3Event, getQuery, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    
    const {
      page = 1,
      limit = 10,
      studentId = '',
      assessmentType = '',
      startDate = '',
      endDate = ''
    } = query
    
    const result = await assessmentService.getAssessments({
      page: Number(page),
      limit: Number(limit),
      studentId: String(studentId),
      assessmentType: String(assessmentType),
      startDate: String(startDate),
      endDate: String(endDate)
    })
    
    return result
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})