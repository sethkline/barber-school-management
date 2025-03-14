import { H3Event, getQuery } from 'h3'
import { communicationService } from '~/server/services/communicationsService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    const studentId = query.studentId as string | undefined
    const leadId = query.leadId as string | undefined
    const limit = query.limit ? parseInt(query.limit as string) : 10
    const page = query.page ? parseInt(query.page as string) : 1
    
    // Ensure at least one filter is provided
    if (!studentId && !leadId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Either studentId or leadId must be provided'
      })
    }
    
    const history = await communicationService.getCommunicationHistory({
      studentId,
      leadId,
      limit,
      page
    })
    
    return history
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})