import { H3Event, defineEventHandler } from 'h3'
import { hoursService } from '~/server/services/hoursService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event)
    
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const studentId = query.studentId as string || undefined
    const startDate = query.startDate as string || undefined
    const endDate = query.endDate as string || undefined
    
    const result = await hoursService.getHoursRecords({
      page,
      limit,
      studentId,
      startDate,
      endDate
    })
    
    return result
  } catch (error: any) {
    return createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})