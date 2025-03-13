import { H3Event, readBody, sendError, createError } from 'h3'
import { taskService } from '~/server/services/taskService'
import type { TablesInsert } from '~/types/supabase'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Parse the task data from the request body
    const taskData = await readBody(event) as TablesInsert<'tasks'>
    
    // Create the task using the task service
    const task = await taskService.createTask(taskData)
    
    return { task }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})