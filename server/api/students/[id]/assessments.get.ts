import { H3Event } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  const studentId = event.context.params.id
  
  try {
    const { data, count } = await assessmentService.getAssessments({
      studentId,
      page: 1,
      limit: 100 // Reasonable limit for a student detail view
    })
    
    return { data, count }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Error fetching assessment records: ${error.message}`
    })
  }
})