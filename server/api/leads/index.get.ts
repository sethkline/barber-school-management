import { H3Event, getQuery, sendError, createError } from 'h3'
import { leadService } from '~/server/services/leadService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    
    // Parse pagination, search, and filter parameters
    const params = {
      page: query.page ? parseInt(query.page as string) : 1,
      limit: query.limit ? parseInt(query.limit as string) : 10,
      search: query.search as string || '',
      status: query.status as string || '',
      fromDate: query.fromDate as string || '',
      toDate: query.toDate as string || ''
    }
    
    // Fetch leads using the lead service
    const { data, count } = await leadService.getLeads(params)
    
    // Return the leads and the total count for pagination
    return {
      leads: data,
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