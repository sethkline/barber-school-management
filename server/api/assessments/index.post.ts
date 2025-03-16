// server/api/assessments/index.post.ts
import { H3Event, readBody, sendError, createError } from 'h3'
import { assessmentService } from '~/server/services/assessmentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.student_id) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Student ID is required' 
      }))
    }
    
    if (!body.assessment_type) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Assessment type is required' 
      }))
    }
    
    // Set assessment date to today if not provided
    if (!body.assessment_date) {
      body.assessment_date = new Date().toISOString().split('T')[0]
    }
    
    const result = await assessmentService.createAssessment(body)
    return result
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 400, 
      statusMessage: error.message 
    }))
  }
})