import { H3Event, sendError, createError } from 'h3'
import { taskService } from '~/server/services/taskService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the lead ID from the URL params
    const leadId = event.context.params?.id
    
    if (!leadId) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Lead ID is required' 
      }))
    }
    
    // Fetch tasks for this lead
    const tasks = await taskService.getTasksByLeadId(leadId)
    
    return { tasks }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})