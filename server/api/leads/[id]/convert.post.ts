import { H3Event, sendError, createError } from 'h3'
import { leadService } from '~/server/services/leadService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the lead ID from the URL params
    const id = event.context.params?.id
    
    if (!id) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Lead ID is required' 
      }))
    }
    
    // Convert the lead to a student
    const { student, lead } = await leadService.convertLeadToStudent(id)
    
    return { 
      success: true,
      message: 'Lead successfully converted to student',
      student,
      lead
    }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})