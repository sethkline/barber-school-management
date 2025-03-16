// server/api/assessments/student-progress/[id].get.ts
import { H3Event, getQuery, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const studentId = event.context.params?.id
    
    if (!studentId) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Student ID is required' 
      }))
    }
    
    const query = getQuery(event)
    const assessmentType = query.assessmentType ? String(query.assessmentType) : undefined
    
    const progress = await assessmentService.getStudentProgress(studentId, assessmentType)
    return progress
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})