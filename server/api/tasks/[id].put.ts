import { H3Event, readBody, sendError, createError } from 'h3'
import { taskService } from '~/server/services/taskService'
import type { TablesUpdate } from '~/types/supabase'

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
    
    // Parse the task data from the request body
    const taskData = await readBody(event) as TablesUpdate<'tasks'>
    
    // Update the task using the task service
    const task = await taskService.updateTask(id, taskData)
    
    return { task }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})