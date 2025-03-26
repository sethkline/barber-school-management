import { H3Event, sendError, createError } from 'h3'
import { taskService } from '~/server/services/taskService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get the task ID from the URL params
    const id = event.context.params?.id
    
    if (!id) {
      return sendError(event, createError({ 
        statusCode: 400, 
        statusMessage: 'Task ID is required' 
      }))
    }
    
    // Delete the task using the task service
    const task = await taskService.deleteTask(id)
    
    return { 
      success: true,
      message: 'Task deleted successfully',
      deletedId: id
    }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})