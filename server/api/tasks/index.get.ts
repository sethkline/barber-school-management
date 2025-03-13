import { H3Event, getQuery, sendError, createError } from 'h3'
import { taskService } from '~/server/services/taskService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    
    // Parse pagination and filter parameters
    const params = {
      page: query.page ? parseInt(query.page as string) : 1,
      limit: query.limit ? parseInt(query.limit as string) : 10,
      leadId: query.leadId as string || '',
      status: query.status as string || '',
      assignedTo: query.assignedTo as string || ''
    }
    
    // Fetch tasks using the task service
    const { data, count } = await taskService.getTasks(params)
    
    // Return the tasks and the total count for pagination
    return {
      tasks: data,
      total: count,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(count / params.limit)
    }
  } catch (error: any) {
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error.message 
    }))
  }
})